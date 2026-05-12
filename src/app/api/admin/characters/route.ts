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
    return NextResponse.json({ error: '获取角色列表失败' }, { status: 500 })
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
        title: data.title,
        avatar: data.avatar,
        banner: data.banner,
        rarity: data.rarity || 5,
        role: data.role,
        weapon: data.weapon,
        coreBonus: data.coreBonus,
        acquisition: data.acquisition,
        description: data.description,
        attributes: data.attributes,
        skills: data.skills,
        rumors: data.rumors,
        teamComp: data.teamComp,
        troopRec: data.troopRec,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      })
      .select('*, CharacterCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建角色失败' }, { status: 500 })
  }
}