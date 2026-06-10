export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // 從 SiteConfig 讀取 banner 文章 ID 列表
    const { data: configRow } = await supabaseAdmin
      .from('SiteConfig')
      .select('value')
      .eq('key', 'bannerArticleIds')
      .single()

    let ids: string[] = []
    if (configRow?.value) {
      try { ids = JSON.parse(configRow.value) } catch { ids = [] }
    }

    if (ids.length === 0) {
      // fallback：取最新的 featured 文章
      const { data } = await supabaseAdmin
        .from('Article')
        .select('*, Category(*)')
        .eq('isPublished', true)
        .eq('isFeatured', true)
        .order('createdAt', { ascending: false })
        .limit(8)

      const mapped = (data || []).map(({ Category, ...rest }: any) => ({
        ...rest,
        category: Category,
      }))
      return NextResponse.json(mapped)
    }

    // 按 ID 列表取文章
    const { data, error } = await supabaseAdmin
      .from('Article')
      .select('*, Category(*)')
      .in('id', ids)
      .eq('isPublished', true)

    if (error) throw error

    // 按配置順序排列
    const articleMap = new Map((data || []).map((a: any) => [a.id, a]))
    const ordered = ids.map(id => articleMap.get(id)).filter(Boolean)

    const mapped = ordered.map(({ Category, ...rest }: any) => ({
      ...rest,
      category: Category,
    }))

    return NextResponse.json(mapped)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
