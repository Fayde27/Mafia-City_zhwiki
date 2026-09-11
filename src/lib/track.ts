// 前台埋點小工具（看板數據來源）
//
// 原則：埋點永遠不能影響使用者。全部 fire-and-forget、錯誤吞掉、
// 不 await、不擋渲染。

export type TrackMetric = 'page' | 'article' | 'item' | 'event' | 'lineup'

function post(body: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // 使用者馬上跳頁時也盡量把這筆送出去
    }).catch(() => {})
  } catch {
    // ignore
  }
}

/** 單篇內容點擊：文章 / 道具 / 活動 / 陣容 */
export function trackView(metric: Exclude<TrackMetric, 'page'>, id: string) {
  if (!id) return
  post({ metric, key: id })
}

/** 搜索：關鍵字 + 是否有結果（hasResult=false 會進「該補內容」清單） */
export function trackSearch(keyword: string, hasResult: boolean) {
  if (!keyword?.trim()) return
  post({ metric: 'search', key: keyword.trim(), hasResult })
}

/**
 * 把任意路徑收斂成「模塊」層級，給看板做模塊對比用。
 *   /wiki/items/abc  → /wiki/items
 *   /wiki/lineups    → /wiki/lineups
 *   /                → /
 * 詳情頁的單篇數據另由 trackView 記在各自 metric 下，這裡只要模塊總量。
 */
export function toModuleKey(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  const seg = pathname.split('?')[0].split('/').filter(Boolean)
  if (seg.length === 0) return '/'
  // 後台不統計
  if (seg[0] === 'admin') return ''
  return '/' + seg.slice(0, 2).join('/')
}

/** 模塊 PV */
export function trackPage(pathname: string) {
  const key = toModuleKey(pathname)
  if (!key) return
  post({ metric: 'page', key })
}
