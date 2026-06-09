export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('Character')
      .select('*, CharacterCategory(*)', { count: 'exact' })
      .eq('CharacterCategory.slug', 'haojie')

    // Use inner join to filter by category slug
    query = supabaseAdmin
      .from('Character')
      .select('*, CharacterCategory!inner(*)', { count: 'exact' })
      .eq('CharacterCategory.slug', 'haojie')

    const draft = searchParams.get('draft')
    if (draft === 'true') query = query.eq('isPublished', false)

    const { data: haojie, error, count } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      haojie,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取豪杰列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: haojie, error } = await supabaseAdmin
      .from('Character')
      .insert({
        name: data.name,
        slug: data.slug,
        avatar: data.avatar,
        avatarPosition: data.avatarPosition,
        banner: data.banner,
        bannerPosition: data.bannerPosition,
        rarity: data.rarity || '金',
        traits: data.traits,
        troopType: data.troopType,
        acquisition: data.acquisition,
        story: data.story,
        attributes: data.attributes,
        skills: data.skills,
        awakenHero: data.awakenHero || false,
        haojieEquip: data.haojieEquip,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      })
      .select('*, CharacterCategory(*)')
      .single()

    if (error) throw error

    return NextResponse.json(haojie, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '創建豪杰失敗' }, { status: 500 })
  }
}
