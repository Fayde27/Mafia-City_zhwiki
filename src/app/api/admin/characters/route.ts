export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('Character')
      .select('*, CharacterCategory(*)', { count: 'exact' })

    if (category) {
      query = supabaseAdmin
        .from('Character')
        .select('*, CharacterCategory!inner(*)', { count: 'exact' })
        .eq('CharacterCategory.slug', category)
    }

    const draft = searchParams.get('draft')
    if (draft === 'true') query = query.eq('isPublished', false)

    const { data: characters, error, count } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      characters,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取角色列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: character, error } = await supabaseAdmin
      .from('Character')
      .insert({
        name: data.name,
        slug: data.slug,
        avatar: data.avatar,
        banner: data.banner,
        bannerPosition: data.bannerPosition,
        rarity: data.rarity || '金',
        traits: data.traits,
        troopType: data.troopType,
        acquisition: data.acquisition,
        story: data.story,
        attributes: data.attributes,
        skills: data.skills,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      })
      .select('*, CharacterCategory(*)')
      .single()

    if (error) throw error

    // save relations
    if (character) {
      await saveRelations(character.id, data)
    }

    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '創建角色失敗' }, { status: 500 })
  }
}

async function saveRelations(characterId: string, data: any) {
  // Skins
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

  // SkinBonds
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

  // TeamComps
  if (Array.isArray(data.teamComps)) {
    // delete members first (cascade), then comps
    const { data: oldComps } = await supabaseAdmin
      .from('CharacterTeamComp')
      .select('id')
      .eq('characterId', characterId)
    if (oldComps && oldComps.length > 0) {
      const ids = oldComps.map((c: any) => c.id)
      await supabaseAdmin.from('CharacterTeamCompMember').delete().in('teamCompId', ids)
    }
    await supabaseAdmin.from('CharacterTeamComp').delete().eq('characterId', characterId)
    for (let i = 0; i < data.teamComps.length; i++) {
      const tc = data.teamComps[i]
      const { data: inserted } = await supabaseAdmin
        .from('CharacterTeamComp')
        .insert({ characterId, name: tc.name, reason: tc.reason, sortOrder: i })
        .select('id')
        .single()
      if (inserted && Array.isArray(tc.memberIds)) {
        const members = tc.memberIds.map((mid: string, j: number) => ({
          teamCompId: inserted.id,
          memberId: mid,
          sortOrder: j,
        }))
        if (members.length > 0) {
          await supabaseAdmin.from('CharacterTeamCompMember').insert(members)
        }
      }
    }
  }

  // BloodBonds
  if (Array.isArray(data.bloodBonds)) {
    const { data: oldBonds } = await supabaseAdmin
      .from('CharacterBloodBond')
      .select('id')
      .eq('characterId', characterId)
    if (oldBonds && oldBonds.length > 0) {
      const ids = oldBonds.map((b: any) => b.id)
      await supabaseAdmin.from('CharacterBloodBondMember').delete().in('bloodBondId', ids)
    }
    await supabaseAdmin.from('CharacterBloodBond').delete().eq('characterId', characterId)
    for (let i = 0; i < data.bloodBonds.length; i++) {
      const bb = data.bloodBonds[i]
      const { data: inserted } = await supabaseAdmin
        .from('CharacterBloodBond')
        .insert({
          characterId,
          requiredStars: bb.requiredStars || 0,
          bonuses: JSON.stringify(bb.bonuses || []),
          sortOrder: i,
        })
        .select('id')
        .single()
      if (inserted && Array.isArray(bb.memberIds)) {
        const members = bb.memberIds.map((mid: string, j: number) => ({
          bloodBondId: inserted.id,
          memberId: mid,
          sortOrder: j,
        }))
        if (members.length > 0) {
          await supabaseAdmin.from('CharacterBloodBondMember').insert(members)
        }
      }
    }
  }

  // Equipment links
  if (Array.isArray(data.equipmentIds)) {
    await supabaseAdmin.from('CharacterEquipment').delete().eq('characterId', characterId)
    if (data.equipmentIds.length > 0) {
      await supabaseAdmin.from('CharacterEquipment').insert(
        data.equipmentIds.map((eid: string, i: number) => ({
          characterId,
          equipmentId: eid,
          sortOrder: i,
        }))
      )
    }
  }

  // Article links
  if (Array.isArray(data.articleIds)) {
    await supabaseAdmin.from('CharacterArticle').delete().eq('characterId', characterId)
    if (data.articleIds.length > 0) {
      await supabaseAdmin.from('CharacterArticle').insert(
        data.articleIds.map((aid: string, i: number) => ({
          characterId,
          articleId: aid,
          sortOrder: i,
        }))
      )
    }
  }
}
