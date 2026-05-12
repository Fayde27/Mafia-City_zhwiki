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
      .from('Equipment')
      .select('*, EquipmentCategory(*)', { count: 'exact' })

    if (category) {
      query = query.eq('EquipmentCategory.slug', category)
    }

    const { data: equipment, error, count: total } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      equipment,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取装备列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: equip, error } = await supabaseAdmin
      .from('Equipment')
      .insert({
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity || 3,
        type: data.type,
        slot: data.slot,
        attack: data.attack || 0,
        defense: data.defense || 0,
        hp: data.hp || 0,
        speed: data.speed || 0,
        skill: data.skill,
        description: data.description,
        stats: data.stats,
        enhancement: data.enhancement,
        acquisition: data.acquisition,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      })
      .select('*, EquipmentCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(equip, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建装备失败' }, { status: 500 })
  }
}