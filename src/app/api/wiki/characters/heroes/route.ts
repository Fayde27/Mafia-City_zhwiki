export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
    }

    const { data: character, error } = await supabaseAdmin
      .from('Character')
      .select('*, CharacterCategory(*)')
      .eq('slug', slug)
      .eq('isPublished', true)
      .single()

    if (error || !character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    }

    // 關聯表為手動建表、未定義外鍵，PostgREST 無法用嵌套 embed，全部改平鋪查詢
    const [
      { data: skins },
      { data: skinBonds },
      { data: teamComps },
      { data: bloodBonds },
      { data: eqLinks },
      { data: artLinks },
      { data: teamMembers },
      { data: bloodMembers },
    ] = await Promise.all([
      supabaseAdmin.from('CharacterSkin').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterSkinBond').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterTeamComp').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterBloodBond').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterEquipment').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterArticle').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterTeamCompMember').select('*'),
      supabaseAdmin.from('CharacterBloodBondMember').select('*'),
    ])

    // 成員角色信息
    const membersOf = (links: any[], parentId: string, key: string) =>
      (links || []).filter((m: any) => m[key] === parentId).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    const allMemberIds = [
      ...(teamMembers || []).map((m: any) => m.memberId),
      ...(bloodMembers || []).map((m: any) => m.memberId),
    ]
    const uniqueIds = Array.from(new Set(allMemberIds))
    let memberMap: Record<string, any> = {}
    if (uniqueIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from('Character')
        .select('id,name,slug,avatar,rarity')
        .in('id', uniqueIds)
      if (members) members.forEach((m: any) => { memberMap[m.id] = m })
    }

    // 裝備 / 相關攻略詳情
    const equipmentIds = (eqLinks || []).map((e: any) => e.equipmentId)
    const articleIds = (artLinks || []).map((a: any) => a.articleId)
    let equipments: any[] = []
    let relatedArticles: any[] = []
    if (equipmentIds.length > 0) {
      const { data } = await supabaseAdmin.from('Equipment').select('id,name,slug,icon,rarity,slot').in('id', equipmentIds)
      const byId = new Map((data || []).map((e: any) => [e.id, e]))
      equipments = equipmentIds.map(id => byId.get(id)).filter(Boolean)
    }
    if (articleIds.length > 0) {
      const { data } = await supabaseAdmin.from('Article').select('id,title,slug,coverImage').in('id', articleIds)
      const byId = new Map((data || []).map((a: any) => [a.id, a]))
      relatedArticles = articleIds.map(id => byId.get(id)).filter(Boolean)
    }

    const { CharacterCategory, ...charRest } = character as any

    return NextResponse.json({
      ...charRest,
      category: CharacterCategory,
      skins: (skins || []).map((s: any) => ({ ...s, bonuses: tryParse(s.bonuses, []) })),
      skinBonds: (skinBonds || []).map((b: any) => ({
        ...b,
        skinIds: tryParse(b.skinIds, []),
        bonuses: tryParse(b.bonuses, []),
      })),
      teamComps: (teamComps || []).map((tc: any) => ({
        id: tc.id,
        name: tc.name,
        reason: tc.reason,
        members: membersOf(teamMembers as any[], tc.id, 'teamCompId')
          .map((m: any) => memberMap[m.memberId]).filter(Boolean),
      })),
      bloodBonds: (bloodBonds || []).map((bb: any) => ({
        id: bb.id,
        requiredStars: bb.requiredStars,
        bonuses: tryParse(bb.bonuses, []),
        members: membersOf(bloodMembers as any[], bb.id, 'bloodBondId')
          .map((m: any) => memberMap[m.memberId]).filter(Boolean),
      })),
      equipments,
      relatedArticles,
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取角色失敗' }, { status: 500 })
  }
}

function tryParse(val: any, fallback: any) {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}
