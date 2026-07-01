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

    // 診斷：回查實際存入的裝備關聯數
    const { count: savedEquipCount } = await supabaseAdmin
      .from('CharacterEquipment')
      .select('*', { count: 'exact', head: true })
      .eq('characterId', params.id)

    return NextResponse.json({ ...character, _savedEquipCount: savedEquipCount ?? -1 })
  } catch (error: any) {
    return NextResponse.json({ error: '更新角色失敗：' + (error?.message || '未知錯誤') }, { status: 500 })
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

// 包一層：任何 delete/insert 出錯都拋出，避免靜默失敗（外層 catch 會帶上真實訊息）
function check({ error }: { error: any }, where: string) {
  if (error) throw new Error(`${where}: ${error.message || error}`)
}

async function saveRelations(characterId: string, data: any) {
  if (Array.isArray(data.skins)) {
    check(await supabaseAdmin.from('CharacterSkin').delete().eq('characterId', characterId), '刪除舊皮膚')
    if (data.skins.length > 0) {
      check(await supabaseAdmin.from('CharacterSkin').insert(
        data.skins.map((s: any, i: number) => ({
          id: crypto.randomUUID(),
          characterId,
          name: s.name,
          art: s.art,
          icon: s.icon,
          bonuses: JSON.stringify(s.bonuses || []),
          acquisition: s.acquisition,
          sortOrder: i,
        }))
      ), '保存皮膚')
    }
  }

  if (Array.isArray(data.skinBonds)) {
    check(await supabaseAdmin.from('CharacterSkinBond').delete().eq('characterId', characterId), '刪除舊皮膚羁绊')
    if (data.skinBonds.length > 0) {
      check(await supabaseAdmin.from('CharacterSkinBond').insert(
        data.skinBonds.map((b: any, i: number) => ({
          id: crypto.randomUUID(),
          characterId,
          name: b.name,
          skinIds: JSON.stringify(b.skinIds || []),
          bonuses: JSON.stringify(b.bonuses || []),
          sortOrder: i,
        }))
      ), '保存皮膚羁绊')
    }
  }

  if (Array.isArray(data.teamComps)) {
    const { data: oldComps } = await supabaseAdmin
      .from('CharacterTeamComp')
      .select('id')
      .eq('characterId', characterId)
    if (oldComps && oldComps.length > 0) {
      check(await supabaseAdmin.from('CharacterTeamCompMember').delete().in('teamCompId', oldComps.map((c: any) => c.id)), '刪除舊陣容成員')
    }
    check(await supabaseAdmin.from('CharacterTeamComp').delete().eq('characterId', characterId), '刪除舊陣容')
    for (let i = 0; i < data.teamComps.length; i++) {
      const tc = data.teamComps[i]
      const { data: inserted, error } = await supabaseAdmin
        .from('CharacterTeamComp')
        .insert({ id: crypto.randomUUID(), characterId, name: tc.name, reason: tc.reason, sortOrder: i })
        .select('id')
        .single()
      check({ error }, '保存陣容搭配')
      if (inserted && Array.isArray(tc.memberIds) && tc.memberIds.length > 0) {
        check(await supabaseAdmin.from('CharacterTeamCompMember').insert(
          tc.memberIds.map((mid: string, j: number) => ({ id: crypto.randomUUID(), teamCompId: inserted.id, memberId: mid, sortOrder: j }))
        ), '保存陣容成員')
      }
    }
  }

  if (Array.isArray(data.bloodBonds)) {
    const { data: oldBonds } = await supabaseAdmin
      .from('CharacterBloodBond')
      .select('id')
      .eq('characterId', characterId)
    if (oldBonds && oldBonds.length > 0) {
      check(await supabaseAdmin.from('CharacterBloodBondMember').delete().in('bloodBondId', oldBonds.map((b: any) => b.id)), '刪除舊血盟成員')
    }
    check(await supabaseAdmin.from('CharacterBloodBond').delete().eq('characterId', characterId), '刪除舊血盟')
    for (let i = 0; i < data.bloodBonds.length; i++) {
      const bb = data.bloodBonds[i]
      const { data: inserted, error } = await supabaseAdmin
        .from('CharacterBloodBond')
        .insert({ id: crypto.randomUUID(), characterId, requiredStars: bb.requiredStars || 0, bonuses: JSON.stringify(bb.bonuses || []), sortOrder: i })
        .select('id')
        .single()
      check({ error }, '保存血盟')
      if (inserted && Array.isArray(bb.memberIds) && bb.memberIds.length > 0) {
        check(await supabaseAdmin.from('CharacterBloodBondMember').insert(
          bb.memberIds.map((mid: string, j: number) => ({ id: crypto.randomUUID(), bloodBondId: inserted.id, memberId: mid, sortOrder: j }))
        ), '保存血盟成員')
      }
    }
  }

  if (Array.isArray(data.equipmentIds)) {
    check(await supabaseAdmin.from('CharacterEquipment').delete().eq('characterId', characterId), '刪除舊裝備')
    if (data.equipmentIds.length > 0) {
      check(await supabaseAdmin.from('CharacterEquipment').insert(
        data.equipmentIds.map((eid: string, i: number) => ({ id: crypto.randomUUID(), characterId, equipmentId: eid, sortOrder: i }))
      ), '保存裝備')
    }
  }

  if (Array.isArray(data.articleIds)) {
    check(await supabaseAdmin.from('CharacterArticle').delete().eq('characterId', characterId), '刪除舊攻略')
    if (data.articleIds.length > 0) {
      check(await supabaseAdmin.from('CharacterArticle').insert(
        data.articleIds.map((aid: string, i: number) => ({ id: crypto.randomUUID(), characterId, articleId: aid, sortOrder: i }))
      ), '保存攻略')
    }
  }
}
