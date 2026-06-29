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
    '/wiki/characters',
    '/wiki/buildings',
    '/wiki/equipment',
    '/wiki/items',
    '/wiki/troops',
    '/wiki/guides',
    '/wiki/submit',
  ].map(p => ({ url: `${BASE}${p}` }))

  // 裝備 4 個子類型列表頁
  const equipTypes = ['haojie_weapon', 'haojie_warbadge', 'leader', 'hero']
  const equipTypePaths: MetadataRoute.Sitemap = equipTypes.map(t => ({
    url: `${BASE}/wiki/equipment/${t}`,
  }))

  // 帶分類的內容詳情頁
  const [buildings, characters, items, troops] = await Promise.all([
    categoryPaths('Building', 'BuildingCategory', 'buildings'),
    categoryPaths('Character', 'CharacterCategory', 'characters'),
    categoryPaths('Item', 'ItemCategory', 'items'),
    categoryPaths('Troop', 'TroopCategory', 'troops'),
  ])

  // 裝備詳情頁：URL = /wiki/equipment/{equipType}/{slug}
  let equipment: MetadataRoute.Sitemap = []
  try {
    const { data } = await supabaseAdmin
      .from('Equipment')
      .select('slug, equipType')
      .eq('isPublished', true)
    equipment = (data || [])
      .filter((e: any) => e.slug && e.equipType)
      .map((e: any) => ({ url: `${BASE}/wiki/equipment/${e.equipType}/${e.slug}` }))
  } catch {
    equipment = []
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
    ...equipTypePaths,
    ...buildings,
    ...characters,
    ...items,
    ...troops,
    ...equipment,
    ...articles,
  ]
}
