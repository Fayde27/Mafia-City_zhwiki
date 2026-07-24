export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')

    let query = supabaseAdmin
      .from('Item')
      .select('*, ItemCategory(*)')
      .eq('isPublished', true)

    if (category) {
      query = query.eq('ItemCategory.slug', category)
    }
    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data: items, error } = await query
      .order('sortOrder', { ascending: false })

    if (error) throw error

    const mapped = (items || []).map(({ ItemCategory, ...rest }: any) => ({
      ...rest,
      category: ItemCategory,
    }))

    // 詳情頁：解析相關活動 ID（互鏈），補出展示欄位
    if (slug && mapped.length > 0) {
      let eventIds: string[] = []
      try { eventIds = JSON.parse(mapped[0].relatedEventIds || '[]') } catch { eventIds = [] }
      if (Array.isArray(eventIds) && eventIds.length > 0) {
        const { data: events } = await supabaseAdmin
          .from('Event')
          .select('id, name, slug, icon, iconPosition')
          .in('id', eventIds)
          .eq('isPublished', true)
        const byId = new Map((events || []).map((e: any) => [e.id, e]))
        mapped[0].relatedEvents = eventIds.map(id => byId.get(id)).filter(Boolean)
      } else {
        mapped[0].relatedEvents = []
      }
    }

    return NextResponse.json({ items: mapped })
  } catch {
    return NextResponse.json({ error: '獲取道具失敗' }, { status: 500 })
  }
}