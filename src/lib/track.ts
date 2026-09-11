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

const VISIT_FLAG = 'wiki_visit_counted'

/**
 * 造訪次數：一個人從進站到關掉分頁算一次，中間看幾頁都只算一次。
 * 與「總瀏覽」不同 —— 後者是每開一頁就加一次。
 *
 * 用 sessionStorage 而不是 localStorage：sessionStorage 的生命週期
 * 正好是「這個分頁開著的期間」，關掉就沒了，語義剛好對上。
 * 隱私模式或封鎖儲存時 get/set 會直接丟例外，所以整段包 try —
 * 讀不到就當作新的一次造訪，寧可多算也不要讓埋點整個掛掉。
 */
export function trackVisit() {
  if (typeof window === 'undefined') return
  try {
    if (sessionStorage.getItem(VISIT_FLAG)) return
    sessionStorage.setItem(VISIT_FLAG, '1')
  } catch {
    // 存不了就照記，下一頁會再記一次，屬於可接受的高估
  }
  post({ metric: 'visit', key: '__total__' })
}
