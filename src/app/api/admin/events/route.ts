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
      .from('Event')
      .select('*, EventCategory(*)', { count: 'exact' })

    if (category) query = query.eq('EventCategory.slug', category)

    const draft = searchParams.get('draft')
    if (draft === 'true') query = query.eq('isPublished', false)

    const { data: events, error, count: total } = await query
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      events,
      pagination: { page, limit, total: total || 0, totalPages: Math.ceil((total || 0) / limit) },
    })
  } catch {
    return NextResponse.json({ error: '獲取活動列表失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { data: event, error } = await supabaseAdmin
      .from('Event')
      .insert({
        id: crypto.randomUUID(),
        name: data.name,
        slug: data.slug,
        summary: data.summary || null,
        icon: data.icon || null,
        iconPosition: data.iconPosition || '50% 50%',
        image: data.image || null,
        imagePosition: data.imagePosition || '50% 50%',
        condition: data.condition || null,
        gameplay: data.gameplay || null,
        rewards: data.rewards || null,
        relatedGuides: data.relatedGuides || null,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isFeatured: data.isFeatured || false,
        isPublished: data.isPublished || false,
      })
      .select('*, EventCategory(*)')
      .single()

    if (error) throw error
    return NextResponse.json(event, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '創建活動失敗' }, { status: 500 })
  }
}
