export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sanitizeSearch } from '@/lib/sanitize'
import { isAdminRequest } from '@/lib/track-guard'

// 統一埋點入口：全部寫進 DailyStat / SearchLog（看板唯一數據源）
//
// 舊的 /api/wiki/view 保持原樣不動 —— 它背著前台「注水展示數」的邏輯，
// 職責不同，不要合併（見 docs/數據看板規劃.md 3-4）
//
// 允許的 metric：
//   page    → 模塊 PV，key 為路徑前綴，如 /wiki/items
//   visit   → 造訪次數，key 固定 '__total__'；一個分頁從開到關只記一次
//   article / item / event / lineup → 單篇內容點擊，key 為該筆 id
//   search  → key 為關鍵字，另帶 hasResult
const ALLOWED_METRICS = new Set([
  'page', 'visit', 'article', 'item', 'event', 'lineup', 'search',
])

// key 不設限會被塞進垃圾撐爆表：長度截斷 + 只收合理字元
const MAX_KEY_LEN = 120

export async function POST(request: Request) {
  try {
    // 看板只保留外網玩家的數據：已登入管理端的人瀏覽玩家端一律不計。
    // 回 success 是故意的 —— 前端不需要知道自己沒被計入，也不該靠回應去探測登入狀態。
    if (await isAdminRequest(request)) {
      return NextResponse.json({ success: true })
    }

    const { metric, key, hasResult } = await request.json()

    if (typeof metric !== 'string' || !ALLOWED_METRICS.has(metric)) {
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
    }

    // ── 搜索：另走 SearchLog，同時給 DailyStat 記一筆總次數 ──
    if (metric === 'search') {
      const keyword = sanitizeSearch(typeof key === 'string' ? key : '')
      if (!keyword) {
        // 空搜索不記，否則熱搜榜會被空字串洗版
        return NextResponse.json({ success: true })
      }
      await Promise.all([
        supabaseAdmin.rpc('increment_search_log', {
          p_keyword: keyword,
          p_has_result: hasResult === true,
        }),
        supabaseAdmin.rpc('increment_daily_stat', {
          p_metric: 'search',
          p_key: '__total__',
        }),
      ])
      return NextResponse.json({ success: true })
    }

    // ── 其餘維度：直接累加 DailyStat ──
    if (typeof key !== 'string' || !key) {
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
    }
    await supabaseAdmin.rpc('increment_daily_stat', {
      p_metric: metric,
      p_key: key.slice(0, MAX_KEY_LEN),
    })

    return NextResponse.json({ success: true })
  } catch {
    // 埋點失敗絕不能影響前台，一律吞掉
    return NextResponse.json({ success: true })
  }
}
