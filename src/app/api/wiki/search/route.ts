export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sanitizeSearch, clampLimit } from '@/lib/sanitize'

// 聚合站內搜索：供富文本「插入內鏈」的條目選擇器使用
// 參數：q（關鍵字）· type（可選，限定單一實體）· limit（每類上限）
// 返回：統一形狀 { type, id, name, url, category, icon }

type EntityType = 'article' | 'item' | 'event' | 'lineup'

const TYPE_LABELS: Record<EntityType, string> = {
  article: '攻略',
  item: '道具',
  event: '活動',
  lineup: '陣容',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = sanitizeSearch(searchParams.get('q'))
    const type = searchParams.get('type') as EntityType | null
    const limit = clampLimit(searchParams.get('limit'), 10, 20)

    if (!q) return NextResponse.json({ results: [] })

    const want = (t: EntityType) => !type || type === t

    const tasks: PromiseLike<any[]>[] = []

    // 文章 /wiki/article/[slug]
    if (want('article')) {
      tasks.push(
        supabaseAdmin
          .from('Article')
          .select('id, title, slug, coverImage')
          .eq('isPublished', true)
          .or(`title.ilike.%${q}%,content.ilike.%${q}%,tags.ilike.%${q}%`)
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
          .select('id, name, slug, icon')
          .eq('isPublished', true)
          .or(`name.ilike.%${q}%,summary.ilike.%${q}%`)
          .order('sortOrder', { ascending: false })
          .limit(limit)
          .then(({ data }) =>
            (data || []).map((i: any) => ({
              type: 'item' as const,
              id: i.id,
              name: i.name,
              url: `/wiki/items/${i.slug}`,
              category: TYPE_LABELS.item,
              icon: i.icon || '',
            }))
          )
      )
    }

    // 活動 /wiki/events/[slug]（名稱或簡介模糊匹配）
    if (want('event')) {
      tasks.push(
        supabaseAdmin
          .from('Event')
          .select('id, name, slug, icon')
          .eq('isPublished', true)
          .or(`name.ilike.%${q}%,summary.ilike.%${q}%`)
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

    // 陣容 /wiki/lineups（標題或解說模糊匹配；無獨立詳情頁，導向列表）
    if (want('lineup')) {
      tasks.push(
        supabaseAdmin
          .from('Lineup')
          .select('id, title, slug, characterKind')
          .eq('isPublished', true)
          .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
          .order('sortOrder', { ascending: true })
          .limit(limit)
          .then(({ data }) =>
            (data || []).map((l: any) => ({
              type: 'lineup' as const,
              id: l.id,
              name: l.title,
              // 豪傑/英雄為兩個獨立頁面
              url: l.characterKind === 'hero' ? '/wiki/hero-lineups' : '/wiki/lineups',
              category: (l.characterKind === 'hero' ? '英雄' : '豪傑') + TYPE_LABELS.lineup,
              icon: '',
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
