export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '200')
    const category = searchParams.get('category')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('Item')
      .select('*, ItemCategory(*)', { count: 'exact' })

    if (category) query = query.eq('ItemCategory.slug', category)

    const draft = searchParams.get('draft')
    if (draft === 'true') query = query.eq('isPublished', false)

    const { data: items, error, count: total } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      items,
      pagination: { page, limit, total: total || 0, totalPages: Math.ceil((total || 0) / limit) },
    })
  } catch {
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
        summary: data.summary || null,
        icon: data.icon || null,
        iconPosition: data.iconPosition || '50% 50%',
        image: data.image || null,
        imagePosition: data.imagePosition || '50% 50%',
        source: data.source || null,
        isExchange: data.isExchange || false,
        exchangeContent: data.exchangeContent || null,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isFeatured: data.isFeatured || false,
        isPublished: data.isPublished || false,
        // 保留舊字段向後兼容
        rarity: data.rarity || 3,
        type: data.type || null,
        quality: data.quality || null,
        stackable: data.stackable !== undefined ? data.stackable : true,
        effect: data.effect || null,
        description: data.description || null,
        usage: data.usage || null,
        recipe: data.recipe || null,
      })
      .select('*, ItemCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '創建道具失敗' }, { status: 500 })
  }
}
