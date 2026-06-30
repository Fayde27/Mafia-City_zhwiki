export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')

    let query = supabaseAdmin
      .from('Event')
      .select('*, EventCategory(*)')
      .eq('isPublished', true)

    if (category) {
      query = query.eq('EventCategory.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data: events, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    const mapped = (events || []).map(({ EventCategory, ...rest }: any) => ({
      ...rest,
      category: EventCategory,
    }))

    // 詳情頁：解析相關攻略文章 ID，補出 title/slug
    if (slug && mapped.length > 0) {
      let ids: string[] = []
      try { ids = JSON.parse(mapped[0].relatedArticleIds || '[]') } catch { ids = [] }
      if (Array.isArray(ids) && ids.length > 0) {
        const { data: arts } = await supabaseAdmin
          .from('Article')
          .select('id, title, slug')
          .in('id', ids)
          .eq('isPublished', true)
        // 按所選順序排列
        const byId = new Map((arts || []).map((a: any) => [a.id, a]))
        mapped[0].relatedArticles = ids.map(id => byId.get(id)).filter(Boolean)
      } else {
        mapped[0].relatedArticles = []
      }
    }

    return NextResponse.json({ events: mapped })
  } catch {
    return NextResponse.json({ error: '獲取活動失敗' }, { status: 500 })
  }
}
