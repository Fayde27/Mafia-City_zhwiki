export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 看板取數。鑒權由 src/middleware.ts 統一擋掉（matcher 含 /api/admin/:path*），
// 這裡不必再驗 token。
//
// ⚠️ 口徑鐵律：只認 DailyStat / SearchLog 的真實值。
// Article.views 是注水數（隨機 +1~5），一律不得取用。
//
// 聚合全部放 DB 側函數（見 2026-09-analytics-queries.sql）——
// PostgREST 預設單次只回 1000 列，撈回來自己算會被靜默截斷。

const MODULE_LABELS: Record<string, string> = {
  '/': '首頁',
  '/wiki': '內容總覽',
  '/wiki/lineups': '陣容搭配',
  '/wiki/items': '道具介紹',
  '/wiki/events': '活動介紹',
  '/wiki/guides': '玩法攻略',
  '/wiki/article': '攻略文章',
  '/wiki/search': '搜索頁',
  '/wiki/tools': '實用工具',
  '/wiki/rankings': '排行榜',
  '/wiki/submit': '投稿',
  '/wiki/announcements': '公告',
}

// 內容排行要把 id 翻成看得懂的名字
const CONTENT_SOURCES = [
  { metric: 'article', table: 'Article', nameCol: 'title', urlPrefix: '/wiki/article/' },
  { metric: 'item',    table: 'Item',    nameCol: 'name',  urlPrefix: '/wiki/items/' },
  { metric: 'event',   table: 'Event',   nameCol: 'name',  urlPrefix: '/wiki/events/' },
] as const

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** range 參數 → [from, to]。支援 today / 7d / 30d / all / 自訂 from&to */
async function resolveRange(url: URL): Promise<[string, string]> {
  const today = new Date()
  const to = toDateStr(today)

  const from = url.searchParams.get('from')
  const customTo = url.searchParams.get('to')
  if (from && customTo) return [from, customTo]

  const range = url.searchParams.get('range') || '7d'

  if (range === 'today') return [to, to]

  if (range === 'all') {
    const { data } = await supabaseAdmin.rpc('analytics_first_date')
    // 還沒有任何資料時退回近 30 天，避免 from 是 null 讓所有查詢炸掉
    const first = typeof data === 'string' ? data : null
    if (!first) {
      const d = new Date(today); d.setDate(d.getDate() - 30)
      return [toDateStr(d), to]
    }
    return [first, to]
  }

  const days = range === '30d' ? 30 : 7
  const d = new Date(today)
  d.setDate(d.getDate() - (days - 1))
  return [toDateStr(d), to]
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const [from, to] = await resolveRange(url)

    // 沒有 cron，借這支 API 順手清 365 天前的資料（成本可忽略）
    supabaseAdmin.rpc('purge_old_stats').then(() => {}, () => {})

    const [totalsRes, modulesRes, trendRes, searchTopRes, searchNoneRes] = await Promise.all([
      supabaseAdmin.rpc('analytics_totals', { p_from: from, p_to: to }),
      supabaseAdmin.rpc('analytics_modules', { p_from: from, p_to: to }),
      supabaseAdmin.rpc('analytics_trend', { p_from: from, p_to: to }),
      supabaseAdmin.rpc('analytics_search_top', { p_from: from, p_to: to, p_limit: 20 }),
      supabaseAdmin.rpc('analytics_search_noresult', { p_from: from, p_to: to, p_limit: 20 }),
    ])

    // 函數沒建（沒跑 2026-09-analytics-queries.sql）時給出明確訊息，
    // 不要讓看板顯示一片 0 讓人以為是沒流量
    if (totalsRes.error) {
      return NextResponse.json(
        { error: '聚合函數不存在，請先在 Supabase 執行 supabase-migrations/2026-09-analytics-queries.sql' },
        { status: 500 }
      )
    }

    const totalsRow = Array.isArray(totalsRes.data) ? totalsRes.data[0] : totalsRes.data
    const modules = (modulesRes.data || []).map((r: { key: string; count: number }) => ({
      key: r.key,
      label: MODULE_LABELS[r.key] || r.key,
      count: Number(r.count) || 0,
    }))

    // ── 內容排行：先取 Top N 的 id，再回表查名字 ──
    const rankings: Record<string, { id: string; name: string; url: string; count: number }[]> = {}
    await Promise.all(
      CONTENT_SOURCES.map(async src => {
        const { data, error } = await supabaseAdmin.rpc('analytics_top_content', {
          p_metric: src.metric, p_from: from, p_to: to, p_limit: 10,
        })
        if (error || !data?.length) { rankings[src.metric] = []; return }

        const rows = data as { key: string; count: number }[]
        const ids = rows.map(r => r.key)
        const { data: named } = await supabaseAdmin
          .from(src.table)
          .select(`id, slug, ${src.nameCol}`)
          .in('id', ids)

        const nameMap = new Map<string, { name: string; slug: string }>()
        for (const row of (named || []) as Record<string, string>[]) {
          nameMap.set(row.id, { name: row[src.nameCol] || '(未命名)', slug: row.slug || '' })
        }

        rankings[src.metric] = rows.map(r => {
          const hit = nameMap.get(r.key)
          return {
            id: r.key,
            // 查不到 = 內容已被刪除，但歷史點擊數還在，照樣列出來
            name: hit?.name || '(已刪除)',
            url: hit?.slug ? src.urlPrefix + hit.slug : '',
            count: Number(r.count) || 0,
          }
        })
      })
    )

    const topModule = modules.length ? modules[0] : null
    const allContent = Object.values(rankings).flat().sort((a, b) => b.count - a.count)

    return NextResponse.json({
      range: { from, to },
      summary: {
        totalPage: Number(totalsRow?.totalPage) || 0,
        totalSearch: Number(totalsRow?.totalSearch) || 0,
        topModule: topModule ? topModule.label : '—',
        topContent: allContent.length ? allContent[0].name : '—',
      },
      modules,
      trend: (trendRes.data || []).map((r: { date: string; count: number }) => ({
        date: r.date,
        count: Number(r.count) || 0,
      })),
      rankings,
      search: {
        top: (searchTopRes.data || []).map((r: { keyword: string; count: number }) => ({
          keyword: r.keyword, count: Number(r.count) || 0,
        })),
        noResult: (searchNoneRes.data || []).map((r: { keyword: string; count: number }) => ({
          keyword: r.keyword, count: Number(r.count) || 0,
        })),
      },
    })
  } catch {
    return NextResponse.json({ error: '取數失敗' }, { status: 500 })
  }
}
