'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'

interface Troop {
  id: string
  likes?: number
  name: string
  slug: string
  summary?: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  troopType?: string
  combatPower?: number
  attack?: number
  defense?: number
  hp?: number
  speed?: number
  load?: number
  attackRange?: number
  cashCost?: number
  talent?: string
  category: {
    name: string
    slug: string
  }
}

const TROOP_TYPE_LABELS: Record<string, string> = {
  mobster: '暴徒',
  gunman: '槍手',
  biker: '飛車黨',
  vehicle: '改裝車輛',
}

const STAT_ITEMS = [
  { key: 'combatPower', label: '戰鬥力', color: 'text-wiki-accent' },
  { key: 'attack',      label: '攻擊',   color: 'text-red-400' },
  { key: 'defense',     label: '防禦',   color: 'text-blue-400' },
  { key: 'hp',          label: '生命',   color: 'text-green-400' },
  { key: 'speed',       label: '速度',   color: 'text-yellow-400' },
  { key: 'load',        label: '負重',   color: 'text-purple-400' },
  { key: 'attackRange', label: '攻擊距離', color: 'text-orange-400' },
  { key: 'cashCost',    label: '現金支出', color: 'text-emerald-400' },
] as const

// 解析天賦 JSON（向後兼容舊 HTML 字串）
function parseTalents(val?: string): { icon: string; content: string }[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    if (Array.isArray(parsed)) return parsed as { icon: string; content: string }[]
    return [{ icon: '', content: val }]
  } catch {
    return val.trim() ? [{ icon: '', content: val }] : []
  }
}

export default function TroopDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const troopSlug = params?.troopSlug as string
  const [troop, setTroop] = useState<Troop | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/wiki/troops?category=${categorySlug}&slug=${troopSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.troops && data.troops.length > 0) {
          setTroop(data.troops[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [categorySlug, troopSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
        <WikiFooter />
      </div>
    )
  }

  if (!troop) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">
            兵種不存在
          </div>
        </main>
        <WikiFooter />
      </div>
    )
  }

  const talents = parseTalents(troop.talent)
  const hasTalent = talents.some(t => (t.content || '').replace(/<[^>]*>/g, '').trim().length > 0)
  const hasStats = STAT_ITEMS.some(s => ((troop[s.key] as number) || 0) > 0)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* 麵包屑 */}
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6 flex flex-wrap items-center gap-y-1">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/troops" className="hover:text-wiki-accent">兵種圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/troops/${troop.category.slug}`} className="hover:text-wiki-accent">
            {troop.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{troop.name}</span>
        </div>

        {/* Banner 大圖 或 圖標+名稱 */}
        {troop.image ? (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6 md:mb-8">
            <img
              src={troop.image}
              alt={troop.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: troop.imagePosition || '50% 50%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-7">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white drop-shadow-xl mb-1">
                {troop.name}
              </h1>
              {troop.troopType && (
                <span className="inline-block px-2 py-0.5 bg-wiki-accent/90 text-wiki-darker text-xs md:text-sm font-bold rounded">
                  {TROOP_TYPE_LABELS[troop.troopType] || troop.troopType}
                </span>
              )}
              {troop.summary && <p className="text-white/85 text-sm md:text-base mt-1">{troop.summary}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            {troop.icon ? (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                <img src={troop.icon} alt={troop.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: troop.iconPosition || '50% 50%' }} />
              </div>
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-dashed border-wiki-border bg-wiki-gray flex items-center justify-center flex-shrink-0">
                <span className="text-wiki-text-muted text-xs">無圖標</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-wiki-text">{troop.name}</h1>
              {troop.troopType && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded">
                  {TROOP_TYPE_LABELS[troop.troopType] || troop.troopType}
                </span>
              )}
              {troop.summary && <p className="text-wiki-text-muted mt-1 text-sm">{troop.summary}</p>}
            </div>
          </div>
        )}

        {/* 有 Banner 時，圖標 + 類型補在下方 */}
        {troop.image && troop.icon && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-wiki-border bg-wiki-gray flex-shrink-0">
              <img src={troop.icon} alt={troop.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: troop.iconPosition || '50% 50%' }} />
            </div>
          </div>
        )}

        {/* 兵種屬性 */}
        {hasStats && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 md:p-6 mb-4 md:mb-6">
            <h3 className="font-bold text-wiki-accent mb-3 text-sm uppercase tracking-wider">兵種屬性</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STAT_ITEMS.map(({ key, label, color }) => {
                const val = (troop[key] as number) || 0
                if (!val) return null
                return (
                  <div key={key} className="bg-wiki-gray rounded-lg p-3 text-center">
                    <div className={`text-lg font-bold ${color}`}>{val.toLocaleString()}</div>
                    <div className="text-wiki-text-muted text-xs mt-0.5">{label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 兵種天賦 */}
        {hasTalent && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 md:p-6 mb-4 md:mb-6">
            <h3 className="font-bold text-wiki-accent mb-3 text-sm uppercase tracking-wider">兵種天賦</h3>
            <div className="space-y-4">
              {talents.map((t, i) => (
                <div key={i} className="bg-wiki-gray rounded-lg p-4 flex gap-3 md:gap-4 items-start">
                  {t.icon ? (
                    <img src={t.icon} alt="" className="w-12 h-12 object-contain rounded flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-wiki-border rounded flex-shrink-0 flex items-center justify-center text-wiki-text-muted text-xl">✦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <MarkdownRenderer content={t.content} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasStats && !hasTalent && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-8 text-center text-wiki-text-muted mb-4">
            暫無兵種詳情
          </div>
        )}

        <div className="mt-6 md:mt-8 flex justify-center">
          <LikeButton entityType="troop" entityId={troop.id} initialLikes={troop.likes || 0} />
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
