export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: articles, error, count } = await supabaseAdmin
      .from('Article')
      .select('*, Category(*)', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      })
  } catch (error) {
    return NextResponse.json({ error: '獲取文章失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title, slug, content, summary, coverImage, coverImagePosition, categoryId, tags, isPublished, isPinned, badges, sortOrder } = await request.json()
    const { data: article, error } = await supabaseAdmin
      .from('Article')
      .insert({
        title,
        slug,
        content,
        summary,
        coverImage,
        coverImagePosition,
        categoryId,
        tags,
        isPublished: isPublished || false,
        isPinned: isPinned || false,
        badges,
        sortOrder: sortOrder || 0,
      })
      .select('*, Category(*)')
      .single()

    if (error) throw error
    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '創建文章失敗' }, { status: 500 })
  }
}