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

    const draft = searchParams.get('draft')
    let query = supabaseAdmin
      .from('Article')
      .select('*, Category(*)', { count: 'exact' })
    if (draft === 'true') query = query.eq('isPublished', false)

    const { data: articles, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    // 將 Supabase 返回的大寫 Category key 正規化為小寫 category
    const normalized = (articles || []).map(({ Category, ...rest }: any) => ({ ...rest, category: Category ?? null }))

    return NextResponse.json({
      articles: normalized,
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
    const { title, slug, content, summary, coverImage, coverImagePosition, thumbnailPosition, categoryId, tags, isPublished, isPinned, badges, sortOrder } = await request.json()
    const { data: article, error } = await supabaseAdmin
      .from('Article')
      .insert({
        title,
        slug,
        content,
        summary,
        coverImage,
        coverImagePosition,
        thumbnailPosition: thumbnailPosition || "50% 50%",
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
    const { Category, ...rest } = article as any
    return NextResponse.json({ ...rest, category: Category ?? null }, { status: 201 })
  } catch (error: any) {
    console.error('創建文章失敗:', error)
    return NextResponse.json({ error: '創建文章失敗', detail: error?.message }, { status: 500 })
  }
}