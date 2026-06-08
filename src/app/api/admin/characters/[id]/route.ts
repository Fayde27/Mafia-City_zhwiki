export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: character, error } = await supabaseAdmin
      .from('Character')
      .select('*, CharacterCategory(*)')
      .eq('id', params.id)
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
      supabaseAdmin.from('CharacterSkin').select('*').eq('characterId', params.id).order('sortOrder'),
      supabaseAdmin.from('CharacterSkinBond').select('*').eq('characterId', params.id).order('sortOrder'),
      supabaseAdmin.from('CharacterTeamComp').select('*, CharacterTeamCompMember(*)').eq('characterId', params.id).order('sortOrder'),
      supabaseAdmin.from('CharacterBloodBond').select('*, CharacterBloodBondMember(*)').eq('characterId', params.id).order('sortOrder'),
      supabaseAdmin.from('CharacterEquipment').select('*, Equipment(id,name,slug,icon,rarity)').eq('characterId', params.id).order('sortOrder'),
      supabaseAdmin.from('CharacterArticle').select('*, Article(id,title,slug)').eq('characterId', params.id).order('sortOrder'),
    ])

    return NextResponse.json({
      ...character,
      skins: skins || [],
      skinBonds: skinBonds || [],
      teamComps: (teamComps || []).map((tc: any) => ({
        ...tc,
        memberIds: (tc.CharacterTeamCompMember || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((m: any) => m.memberId),
      })),
      bloodBonds: (bloodBonds || []).map((bb: any) => ({
        ...bb,
        memberIds: (bb.CharacterBloodBondMember || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((m: any) => m.memberId),
      })),
      equipmentIds: (equipments || []).map((e: any) => e.equipmentId),
      equipmentDetails: (equipments || []).map((e: any) => e.Equipment).filter(Boolean),
      articleIds: (articles || []).map((a: any) => a.articleId),
      articleDetails: (articles || []).map((a: any) => a.Article).filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取角色失敗' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: character, error } = await supabaseAdmin
      .from('Character')
      .update({
        name: data.name,
        slug: data.slug,
        avatar: data.avatar,
        avatarPosition: data.avatarPosition,
        banner: data.banner,
        bannerPosition: data.bannerPosition,
        rarity: data.rarity,
        traits: data.traits,
        troopType: data.troopType,
        acquisition: data.acquisition,
        story: data.story,
        attributes: data.attributes,
        skills: data.skills,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id)
      .select('*, CharacterCategory(*)')
      .single()

    if (error) throw error

    await saveRelations(params.id, data)

    return NextResponse.json(character)
  } catch (error) {
    return NextResponse.json({ error: '更新角色失敗' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('Character')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '刪除角色失敗' }, { status: 500 })
  }
}

async function saveRelations(characterId: string, data: any) {
  if (Array.isArray(data.skins)) {
    await supabaseAdmin.from('CharacterSkin').delete().eq('characterId', characterId)
    if (data.skins.length > 0) {
      await supabaseAdmin.from('CharacterSkin').insert(
        data.skins.map((s: any, i: number) => ({
          characterId,
          name: s.name,
          art: s.art,
          icon: s.icon,
          bonuses: JSON.stringify(s.bonuses || []),
          acquisition: s.acquisition,
          sortOrder: i,
        }))
      )
    }
  }

  if (Array.isArray(data.skinBonds)) {
    await supabaseAdmin.from('CharacterSkinBond').delete().eq('characterId', characterId)
    if (data.skinBonds.length > 0) {
      await supabaseAdmin.from('CharacterSkinBond').insert(
        data.skinBonds.map((b: any, i: number) => ({
          characterId,
          name: b.name,
          skinIds: JSON.stringify(b.skinIds || []),
          bonuses: JSON.stringify(b.bonuses || []),
          sortOrder: i,
        }))
      )
    }
  }

  if (Array.isArray(data.teamComps)) {
    const { data: oldComps } = await supabaseAdmin
      .from('CharacterTeamComp')
      .select('id')
      .eq('characterId', characterId)
    if (oldComps && oldComps.length > 0) {
      await supabaseAdmin.from('CharacterTeamCompMember').delete().in('teamCompId', oldComps.map((c: any) => c.id))
    }
    await supabaseAdmin.from('CharacterTeamComp').delete().eq('characterId', characterId)
    for (let i = 0; i < data.teamComps.length; i++) {
      const tc = data.teamComps[i]
      const { data: inserted } = await supabaseAdmin
        .from('CharacterTeamComp')
        .insert({ characterId, name: tc.name, reason: tc.reason, sortOrder: i })
        .select('id')
        .single()
      if (inserted && Array.isArray(tc.memberIds) && tc.memberIds.length > 0) {
        await supabaseAdmin.from('CharacterTeamCompMember').insert(
          tc.memberIds.map((mid: string, j: number) => ({ teamCompId: inserted.id, memberId: mid, sortOrder: j }))
        )
      }
    }
  }

  if (Array.isArray(data.bloodBonds)) {
    const { data: oldBonds } = await supabaseAdmin
      .from('CharacterBloodBond')
      .select('id')
      .eq('characterId', characterId)
    if (oldBonds && oldBonds.length > 0) {
      await supabaseAdmin.from('CharacterBloodBondMember').delete().in('bloodBondId', oldBonds.map((b: any) => b.id))
    }
    await supabaseAdmin.from('CharacterBloodBond').delete().eq('characterId', characterId)
    for (let i = 0; i < data.bloodBonds.length; i++) {
      const bb = data.bloodBonds[i]
      const { data: inserted } = await supabaseAdmin
        .from('CharacterBloodBond')
        .insert({ characterId, requiredStars: bb.requiredStars || 0, bonuses: JSON.stringify(bb.bonuses || []), sortOrder: i })
        .select('id')
        .single()
      if (inserted && Array.isArray(bb.memberIds) && bb.memberIds.length > 0) {
        await supabaseAdmin.from('CharacterBloodBondMember').insert(
          bb.memberIds.map((mid: string, j: number) => ({ bloodBondId: inserted.id, memberId: mid, sortOrder: j }))
        )
      }
    }
  }

  if (Array.isArray(data.equipmentIds)) {
    await supabaseAdmin.from('CharacterEquipment').delete().eq('characterId', characterId)
    if (data.equipmentIds.length > 0) {
      await supabaseAdmin.from('CharacterEquipment').insert(
        data.equipmentIds.map((eid: string, i: number) => ({ characterId, equipmentId: eid, sortOrder: i }))
      )
    }
  }

  if (Array.isArray(data.articleIds)) {
    await supabaseAdmin.from('CharacterArticle').delete().eq('characterId', characterId)
    if (data.articleIds.length > 0) {
      await supabaseAdmin.from('CharacterArticle').insert(
        data.articleIds.map((aid: string, i: number) => ({ characterId, articleId: aid, sortOrder: i }))
      )
    }
  }
}
