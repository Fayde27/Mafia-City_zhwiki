export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sanitizeSearch, clampLimit } from '@/lib/sanitize'

// 聚合站內搜索：供富文本「插入內鏈」的條目選擇器使用
// 參數：q（關鍵字）· type（可選，限定單一實體）· limit（每類上限）
// 返回：統一形狀 { type, id, name, url, category, icon }

type EntityType = 'article' | 'item' | 'event'

const TYPE_LABELS: Record<EntityType, string> = {
  article: '文章',
  item: '道具',
  event: '活動',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = sanitizeSearch(searchParams.get('q'))
    const type = searchParams.get('type') as EntityType | null
    const limit = clampLimit(searchParams.get('limit'), 10, 20)

    if (!q) return NextResponse.json({ results: [] })

    const like = `%${q}%`
    const want = (t: EntityType) => !type || type === t

    const tasks: PromiseLike<any[]>[] = []

    // 文章 /wiki/article/[slug]
    if (want('article')) {
      tasks.push(
        supabaseAdmin
          .from('Article')
          .select('id, title, slug, coverImage')
          .eq('isPublished', true)
          .ilike('title', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || []).map((a: any) => ({
              type: 'article' as const,
              id: a.id,
              name: a.title,
              url: `/wiki/article/${a.slug}`,
              category: TYPE_LABELS.article,
              icon: a.coverImage || '',
            }))
          )
      )
    }

    // 道具 /wiki/items/[categorySlug]/[slug]
    if (want('item')) {
      tasks.push(
        supabaseAdmin
          .from('Item')
          .select('id, name, slug, icon, ItemCategory(slug, name)')
          .eq('isPublished', true)
          .ilike('name', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || []).map((i: any) => ({
              type: 'item' as const,
              id: i.id,
              name: i.name,
              url: `/wiki/items/${i.slug}`,
              category: i.ItemCategory?.name || TYPE_LABELS.item,
              icon: i.icon || '',
            }))
          )
      )
    }

    // 活動 /wiki/events/[slug]
    if (want('event')) {
      tasks.push(
        supabaseAdmin
          .from('Event')
          .select('id, name, slug, icon')
          .eq('isPublished', true)
          .ilike('name', like)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || []).map((e: any) => ({
              type: 'event' as const,
              id: e.id,
              name: e.name,
              url: `/wiki/events/${e.slug}`,
              category: TYPE_LABELS.event,
              icon: e.icon || '',
            }))
          )
      )
    }

    const settled = await Promise.all(tasks)
    const results = settled.flat()

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: '搜索失敗' }, { status: 500 })
  }
}
