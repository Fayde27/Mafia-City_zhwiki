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
      .from('Item')
      .select('*, ItemCategory(*)', { count: 'exact' })

    if (category) {
      query = query.eq('ItemCategory.slug', category)
    }

    const { data: items, error, count: total } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取道具列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: item, error } = await supabaseAdmin
      .from('Item')
      .insert({
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        iconPosition: data.iconPosition,
        image: data.image,
        imagePosition: data.imagePosition,
        rarity: data.rarity || 3,
        type: data.type,
        quality: data.quality,
        stackable: data.stackable !== undefined ? data.stackable : true,
        effect: data.effect,
        description: data.description,
        usage: data.usage,
        recipe: data.recipe,
        source: data.source,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      })
      .select('*, ItemCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '創建道具失敗' }, { status: 500 })
  }
}