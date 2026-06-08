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

    const [
      { data: skins },
      { data: skinBonds },
      { data: teamComps },
      { data: bloodBonds },
      { data: equipments },
      { data: articles },
    ] = await Promise.all([
      supabaseAdmin.from('CharacterSkin').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterSkinBond').select('*').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterTeamComp').select('*, CharacterTeamCompMember(memberId,sortOrder)').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterBloodBond').select('*, CharacterBloodBondMember(memberId,sortOrder)').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterEquipment').select('equipmentId, sortOrder, Equipment(id,name,slug,icon,rarity,slot)').eq('characterId', character.id).order('sortOrder'),
      supabaseAdmin.from('CharacterArticle').select('articleId, sortOrder, Article(id,title,slug,coverImage)').eq('characterId', character.id).order('sortOrder'),
    ])

    // resolve member character info for teamComps and bloodBonds
    const allMemberIds = [
      ...(teamComps || []).flatMap((tc: any) => (tc.CharacterTeamCompMember || []).map((m: any) => m.memberId)),
      ...(bloodBonds || []).flatMap((bb: any) => (bb.CharacterBloodBondMember || []).map((m: any) => m.memberId)),
    ]
    const uniqueIds = Array.from(new Set(allMemberIds))

    let memberMap: Record<string, any> = {}
    if (uniqueIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from('Character')
        .select('id,name,slug,avatar,rarity')
        .in('id', uniqueIds)
      if (members) {
        members.forEach((m: any) => { memberMap[m.id] = m })
      }
    }

    const { CharacterCategory, ...charRest } = character as any

    return NextResponse.json({
      ...charRest,
      category: CharacterCategory,
      skins: skins || [],
      skinBonds: (skinBonds || []).map((b: any) => ({
        ...b,
        skinIds: tryParse(b.skinIds, []),
        bonuses: tryParse(b.bonuses, []),
      })),
      teamComps: (teamComps || []).map((tc: any) => ({
        id: tc.id,
        name: tc.name,
        reason: tc.reason,
        members: (tc.CharacterTeamCompMember || [])
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((m: any) => memberMap[m.memberId])
          .filter(Boolean),
      })),
      bloodBonds: (bloodBonds || []).map((bb: any) => ({
        id: bb.id,
        requiredStars: bb.requiredStars,
        bonuses: tryParse(bb.bonuses, []),
        members: (bb.CharacterBloodBondMember || [])
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((m: any) => memberMap[m.memberId])
          .filter(Boolean),
      })),
      equipments: (equipments || []).map((e: any) => e.Equipment).filter(Boolean),
      relatedArticles: (articles || []).map((a: any) => a.Article).filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取角色失敗' }, { status: 500 })
  }
}

function tryParse(val: any, fallback: any) {
  if (!val) return fallback
  try { return JSON.parse(val) } catch { return fallback }
}
