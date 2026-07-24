import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const BASE = 'https://mafiacity-zhwiki.com'

// 帶分類的內容：URL = /wiki/{seg}/{分類slug}/{內容slug}
async function categoryPaths(
  table: string,
  categoryRel: string,
  seg: string,
): Promise<MetadataRoute.Sitemap> {
  try {
    const { data } = await supabaseAdmin
      .from(table)
      .select(`slug, ${categoryRel}(slug)`)
      .eq('isPublished', true)
    return (data || [])
      .map((row: any) => {
        const catSlug = row[categoryRel]?.slug
        if (!row.slug || !catSlug) return null
        return { url: `${BASE}/wiki/${seg}/${catSlug}/${row.slug}` }
      })
      .filter(Boolean) as MetadataRoute.Sitemap
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 靜態公開頁面
  const staticPaths: MetadataRoute.Sitemap = [
    '',
    '/wiki',
    '/wiki/lineups',
    '/wiki/items',
    '/wiki/events',
    '/wiki/guides',
    '/wiki/submit',
  ].map(p => ({ url: `${BASE}${p}` }))

  // 帶分類的道具詳情頁
  const items = await categoryPaths('Item', 'ItemCategory', 'items')

  // 活動詳情頁：URL = /wiki/events/{slug}（層級上調，無分類段）
  let events: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabaseAdmin
      .from('Event')
      .select('slug')
      .eq('isPublished', true)
    events = (data || [])
      .filter((e: any) => e.slug)
      .map((e: any) => ({ url: `${BASE}/wiki/events/${e.slug}` }))
  } catch {
    events = []
  }

  // 文章詳情頁：URL = /wiki/article/{slug}（無分類段）
  let articles: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabaseAdmin
      .from('Article')
      .select('slug')
      .eq('isPublished', true)
    articles = (data || [])
      .filter((a: any) => a.slug)
      .map((a: any) => ({ url: `${BASE}/wiki/article/${a.slug}` }))
  } catch {
    articles = []
  }

  return [
    ...staticPaths,
    ...items,
    ...events,
    ...articles,
  ]
}
