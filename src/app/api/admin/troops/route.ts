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
      .from('Troop')
      .select('*, TroopCategory(*)', { count: 'exact' })

    if (category) {
      query = query.eq('TroopCategory.slug', category)
    }

    const { data: troops, error, count: total } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      troops,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取兵種列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: troop, error } = await supabaseAdmin
      .from('Troop')
      .insert({
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        rarity: data.rarity || 3,
        type: data.type,
        attack: data.attack || 0,
        defense: data.defense || 0,
        hp: data.hp || 0,
        speed: data.speed || 0,
        counter: data.counter,
        weakness: data.weakness,
        description: data.description,
        stats: data.stats,
        skills: data.skills,
        training: data.training,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      })
      .select('*, TroopCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(troop, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '創建兵種失敗' }, { status: 500 })
  }
}