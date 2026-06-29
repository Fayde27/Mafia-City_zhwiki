export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sanitizeSearch, clampLimit } from '@/lib/sanitize'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = clampLimit(searchParams.get('limit'), 10, 50)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const search = sanitizeSearch(searchParams.get('search'))
    const featured = searchParams.get('featured')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 有分類過濾時用 !inner（INNER JOIN），避免返回 category 為 null 的文章
    const selectStr = category ? '*, Category!inner(*)' : '*, Category(*)'

    let query = supabaseAdmin
      .from('Article')
      .select(selectStr, { count: 'exact' })
      .eq('isPublished', true)

    if (category) {
      query = query.eq('Category.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,tags.ilike.%${search}%`)
    }
    if (featured === 'true') {
      query = query.eq('isFeatured', true)
    }

    const { data: articles, error, count: total } = await query
      .order('isPinned', { ascending: false })
      .order('sortOrder', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Supabase 返回關聯數據用大寫表名，映射為前端期望的小寫 category
    const mapped = (articles || []).map(({ Category, ...rest }: any) => ({
      ...rest,
      category: Category,
    }))

    return NextResponse.json({
      articles: mapped,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '獲取文章失敗' }, { status: 500 })
  }
}