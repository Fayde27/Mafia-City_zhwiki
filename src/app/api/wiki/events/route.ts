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

    // 詳情頁：解析相關攻略文章 + 相關道具 ID，補出展示欄位
    if (slug && mapped.length > 0) {
      // 相關攻略
      let artIds: string[] = []
      try { artIds = JSON.parse(mapped[0].relatedArticleIds || '[]') } catch { artIds = [] }
      if (Array.isArray(artIds) && artIds.length > 0) {
        const { data: arts } = await supabaseAdmin
          .from('Article')
          .select('id, title, slug')
          .in('id', artIds)
          .eq('isPublished', true)
        const byId = new Map((arts || []).map((a: any) => [a.id, a]))
        mapped[0].relatedArticles = artIds.map(id => byId.get(id)).filter(Boolean)
      } else {
        mapped[0].relatedArticles = []
      }

      // 相關道具（互鏈）
      let itemIds: string[] = []
      try { itemIds = JSON.parse(mapped[0].relatedItemIds || '[]') } catch { itemIds = [] }
      if (Array.isArray(itemIds) && itemIds.length > 0) {
        const { data: items } = await supabaseAdmin
          .from('Item')
          .select('id, name, slug, icon, iconPosition, ItemCategory(slug)')
          .in('id', itemIds)
          .eq('isPublished', true)
        const byId = new Map((items || []).map((i: any) => [i.id, i]))
        mapped[0].relatedItems = itemIds.map(id => byId.get(id)).filter(Boolean)
          .map((i: any) => ({ id: i.id, name: i.name, slug: i.slug, icon: i.icon, iconPosition: i.iconPosition, categorySlug: i.ItemCategory?.slug }))
      } else {
        mapped[0].relatedItems = []
      }
    }

    return NextResponse.json({ events: mapped })
  } catch {
    return NextResponse.json({ error: '獲取活動失敗' }, { status: 500 })
  }
}
