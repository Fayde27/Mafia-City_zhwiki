export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const search = searchParams.get('search')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('Article')
      .select('*, Category(*)', { count: 'exact' })
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

    const { data: articles, error, count: total } = await query
      .order('isPinned', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Supabase 返回关联数据用大写表名，映射为前端期望的小写 category
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
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 })
  }
}