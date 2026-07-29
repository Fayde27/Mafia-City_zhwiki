import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const BASE = 'https://mafiacity-zhwiki.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 靜態公開頁面
  const staticPaths: MetadataRoute.Sitemap = [
    '',
    '/wiki',
    '/wiki/lineups',
    '/wiki/hero-lineups',
    '/wiki/items',
    '/wiki/events',
    '/wiki/guides',
    '/wiki/submit',
  ].map(p => ({ url: `${BASE}${p}` }))

  // 道具詳情頁：URL = /wiki/items/{slug}（層級上調，無分類段）
  let items: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabaseAdmin
      .from('Item')
      .select('slug')
      .eq('isPublished', true)
    items = (data || [])
      .filter((i: any) => i.slug)
      .map((i: any) => ({ url: `${BASE}/wiki/items/${i.slug}` }))
  } catch {
    items = []
  }

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
