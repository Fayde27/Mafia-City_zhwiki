'use client'

export const runtime = 'edge'

import { useState, useEffect, useCallback } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

// 不引圖表庫（Cloudflare Pages 有體積考量）：
// 條形圖用 CSS 寬度百分比，折線用手寫 SVG，零依賴。

interface ModuleRow { key: string; label: string; count: number }
interface TrendRow { date: string; count: number }
interface RankRow { id: string; name: string; url: string; count: number }
interface SearchRow { keyword: string; count: number }

interface AnalyticsData {
  range: { from: string; to: string }
  summary: { totalPage: number; totalSearch: number; totalVisit: number; topModule: string; topContent: string }
  modules: ModuleRow[]
  trend: TrendRow[]
  rankings: Record<string, RankRow[]>
  search: { top: SearchRow[]; noResult: SearchRow[] }
}

const RANGES = [
  { key: 'today', label: '今日' },
  { key: '7d',    label: '近 7 天' },
  { key: '30d',   label: '近 30 天' },
  { key: 'all',   label: '全部' },
]

const RANK_TABS = [
  { key: 'article', label: '文章' },
  { key: 'item',    label: '道具' },
  { key: 'event',   label: '活動' },
  { key: 'lineup',  label: '陣容' },
]

// 陣容沒有詳情頁（全部平鋪在一頁），計數口徑是「卡片曝光」而非「進入詳情頁」，
// 與其他三類不同 —— 不標出來會被拿去跨類比較
const LINEUP_NOTE = '陣容無詳情頁，此處為卡片曝光數（捲到視野內停留 2 秒以上），與其他三類口徑不同，不可直接比較。'

const cardCls = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

/** 手寫 SVG 折線圖 */
function TrendChart({ data }: { data: TrendRow[] }) {
  if (data.length < 2) {
    return <div className="text-wiki-text-muted text-sm py-12 text-center">資料還不夠畫趨勢（至少要兩天）</div>
  }

  const W = 1000, H = 220, PAD = 28
  const max = Math.max(...data.map(d => d.count), 1)
  const stepX = (W - PAD * 2) / (data.length - 1)
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
  const pts = data.map((d, i) => [PAD + i * stepX, y(d.count)] as const)
  const line = pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${pts[0][0].toFixed(1)},${H - PAD} Z`

  // 標籤最多顯示 7 個，否則 x 軸會糊成一團
  const labelEvery = Math.max(1, Math.ceil(data.length / 7))

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]" style={{ height: 240 }}>
        {/* 水平參考線 */}
        {[0, 0.5, 1].map(r => (
          <line key={r} x1={PAD} x2={W - PAD} y1={y(max * r)} y2={y(max * r)}
                stroke="currentColor" className="text-wiki-border" strokeWidth="1" />
        ))}
        <text x={PAD} y={y(max) - 6} className="fill-wiki-text-muted" fontSize="13">{fmt(max)}</text>

        <path d={area} fill="#c4a35a" opacity="0.12" />
        <path d={line} fill="none" stroke="#c4a35a" strokeWidth="2.5"
              strokeLinejoin="round" strokeLinecap="round" />

        {pts.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r="3" fill="#c4a35a">
            <title>{`${data[i].date}　${fmt(data[i].count)}`}</title>
          </circle>
        ))}

        {data.map((d, i) => i % labelEvery === 0 && (
          <text key={d.date} x={PAD + i * stepX} y={H - 6} textAnchor="middle"
                className="fill-wiki-text-muted" fontSize="12">
            {d.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [range, setRange] = useState('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [rankTab, setRankTab] = useState('article')

  const load = useCallback(async (r: string) => {
    setLoading(true); setErr('')
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`)
      const json = await res.json()
      if (!res.ok) { setErr(json?.error || '取數失敗'); setData(null) }
      else setData(json)
    } catch {
      setErr('取數失敗')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    load(range)
  }, [isAdmin, isLoaded, router, range, load])

  if (!isAdmin) return null

  const maxModule = data?.modules.length ? Math.max(...data.modules.map(m => m.count), 1) : 1
  const ranks = data?.rankings?.[rankTab] || []

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">

        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">數據看板</h1>
            <p className="text-wiki-text-muted text-sm mt-1">
              {data ? `${data.range.from} ~ ${data.range.to}` : ' '}
            </p>
          </div>
          <div className="flex gap-2">
            {RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`px-4 py-2 text-sm border-2 transition-colors ${
                  range === r.key
                    ? 'bg-wiki-accent text-wiki-bg border-wiki-accent font-bold'
                    : 'bg-wiki-gray border-wiki-border text-wiki-text hover:border-wiki-accent/60'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <div className="mb-6 border-2 border-wiki-danger bg-wiki-danger/10 text-wiki-danger rounded px-4 py-3 text-sm">
            {err}
          </div>
        )}

        {loading && <div className="text-center py-20 text-wiki-text-muted">載入中...</div>}

        {!loading && data && (
          <div className="space-y-6">

            {/* ① 總覽卡片 */}
            {/* 12 欄網格：前四張只放數字或短詞，各佔 2 欄；
                「最熱內容」是文章標題，佔 4 欄才不會被截斷 */}
            <div className="grid grid-cols-2 lg:grid-cols-12 gap-3">
              {[
                { label: '總瀏覽', value: fmt(data.summary.totalPage), color: 'text-wiki-accent',
                  span: 'lg:col-span-2', hint: '每開一個頁面算一次' },
                { label: '造訪次數', value: fmt(data.summary.totalVisit), color: 'text-amber-500',
                  span: 'lg:col-span-2', hint: '從進站到關閉分頁算一次，中間看幾頁都算同一次' },
                { label: '搜索次數', value: fmt(data.summary.totalSearch), color: 'text-blue-400',
                  span: 'lg:col-span-2', hint: '' },
                { label: '最熱模塊', value: data.summary.topModule, color: 'text-purple-400',
                  span: 'lg:col-span-2', hint: '' },
                { label: '最熱內容', value: data.summary.topContent, color: 'text-green-400',
                  span: 'col-span-2 lg:col-span-4', hint: '不含陣容，陣容是曝光數、口徑不同' },
              ].map(c => (
                <div key={c.label}
                     className={`bg-wiki-gray-light border border-wiki-border rounded-lg p-4 ${c.span}`}
                     title={c.hint || undefined}>
                  <div className="text-wiki-text-muted text-xs mb-1">{c.label}</div>
                  <div className={`text-xl font-bold truncate ${c.color}`} title={c.value}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* ② 模塊對比 */}
            <div className={cardCls}>
              <h2 className="text-lg font-bold text-wiki-text mb-4">模塊對比</h2>
              {data.modules.length === 0 ? (
                <div className="text-wiki-text-muted text-sm py-6 text-center">這段區間還沒有資料</div>
              ) : (
                <div className="space-y-2">
                  {data.modules.map(m => (
                    <div key={m.key} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 text-sm text-wiki-text truncate" title={m.key}>{m.label}</div>
                      <div className="flex-1 bg-wiki-gray rounded h-6 overflow-hidden">
                        <div className="h-full bg-wiki-accent/80 rounded transition-all"
                             style={{ width: `${Math.max((m.count / maxModule) * 100, 1)}%` }} />
                      </div>
                      <div className="w-20 shrink-0 text-right text-sm text-wiki-text-muted tabular-nums">
                        {fmt(m.count)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ③ 按天趨勢 */}
            <div className={cardCls}>
              <h2 className="text-lg font-bold text-wiki-text mb-4">趨勢（整站瀏覽 · 按天）</h2>
              <TrendChart data={data.trend} />
            </div>

            {/* ④ 內容排行 + 搜索 */}
            <div className="grid lg:grid-cols-2 gap-6">

              <div className={cardCls}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-wiki-text">內容排行 Top 10</h2>
                  <div className="flex gap-1">
                    {RANK_TABS.map(t => (
                      <button key={t.key} onClick={() => setRankTab(t.key)}
                        className={`px-3 py-1 text-xs border transition-colors ${
                          rankTab === t.key
                            ? 'bg-wiki-accent text-wiki-bg border-wiki-accent font-bold'
                            : 'bg-wiki-gray border-wiki-border text-wiki-text-muted hover:border-wiki-accent/60'
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                {rankTab === 'lineup' && (
                  <p className="text-xs text-wiki-text-muted mb-3 leading-relaxed">{LINEUP_NOTE}</p>
                )}
                {ranks.length === 0 ? (
                  <div className="text-wiki-text-muted text-sm py-6 text-center">這段區間還沒有資料</div>
                ) : (
                  <ol className="space-y-1">
                    {ranks.map((r, i) => (
                      <li key={r.id} className="flex items-center gap-3 py-1.5 border-b border-wiki-border last:border-0">
                        <span className="w-6 shrink-0 text-wiki-text-muted text-sm tabular-nums">{i + 1}</span>
                        {r.url ? (
                          <Link href={r.url} target="_blank"
                                className="flex-1 text-sm text-wiki-text hover:text-wiki-accent truncate transition-colors">
                            {r.name}
                          </Link>
                        ) : (
                          <span className="flex-1 text-sm text-wiki-text-muted truncate">{r.name}</span>
                        )}
                        <span className="shrink-0 text-sm text-wiki-accent tabular-nums">{fmt(r.count)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className={cardCls}>
                <h2 className="text-lg font-bold text-wiki-text mb-4">搜索</h2>

                <h3 className="text-sm font-bold text-wiki-text-muted mb-2">熱搜詞 Top 20</h3>
                {data.search.top.length === 0 ? (
                  <div className="text-wiki-text-muted text-sm py-3">還沒有搜索紀錄</div>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {data.search.top.map(s => (
                      <span key={s.keyword} className="bg-wiki-gray border border-wiki-border rounded px-2 py-1 text-xs text-wiki-text">
                        {s.keyword}
                        <span className="text-wiki-text-muted ml-1.5 tabular-nums">{fmt(s.count)}</span>
                      </span>
                    ))}
                  </div>
                )}

                <h3 className="text-sm font-bold text-wiki-danger mb-1">⚠️ 搜了但沒結果</h3>
                <p className="text-xs text-wiki-text-muted mb-2">這些是玩家想找、站上卻沒有的內容 —— 直接當選題表用。</p>
                {data.search.noResult.length === 0 ? (
                  <div className="text-wiki-text-muted text-sm py-3">沒有無結果的搜索，很好</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.search.noResult.map(s => (
                      <span key={s.keyword} className="bg-wiki-danger/10 border border-wiki-danger/40 rounded px-2 py-1 text-xs text-wiki-danger">
                        {s.keyword}
                        <span className="opacity-70 ml-1.5 tabular-nums">{fmt(s.count)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
      <WikiFooter />
    </div>
  )
}
