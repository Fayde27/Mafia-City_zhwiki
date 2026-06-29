'use client'

export const runtime = 'edge'

import { useState, useEffect, useMemo } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'

interface Troop {
  id: string
  name: string
  slug: string
  summary?: string
  icon: string
  iconPosition?: string
  image: string
  imagePosition?: string
  troopType?: string
  combatPower?: number
  attack?: number
  defense?: number
  hp?: number
  speed?: number
  category: { name: string; slug: string }
}

const TROOP_TYPE_LABELS: Record<string, string> = {
  mobster:  '暴徒',
  gunman:   '槍手',
  biker:    '飛車黨',
  vehicle:  '改裝車輛',
}
const TROOP_TYPE_ORDER = ['mobster', 'gunman', 'biker', 'vehicle']

export default function TroopsWikiPage() {
  const [troops, setTroops] = useState<Troop[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType]     = useState('all')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetch('/api/wiki/troops')
      .then(r => r.json())
      .then(d => { setTroops(d.troops || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // 從兵種數據推導類型列表（保持 TROOP_TYPE_ORDER 順序）
  const availableTypes = useMemo(() => {
    const types = new Set(troops.map(t => t.troopType || '').filter(Boolean))
    return TROOP_TYPE_ORDER.filter(t => types.has(t))
  }, [troops])

  // 根據已選類型過濾分類
  const availableCategories = useMemo(() => {
    const pool = activeType === 'all' ? troops : troops.filter(t => t.troopType === activeType)
    const seen = new Map<string, string>()
    pool.forEach(t => { if (t.category?.slug) seen.set(t.category.slug, t.category.name) })
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }))
  }, [troops, activeType])

  // 換類型時重置細分分類
  const handleTypeChange = (type: string) => {
    setActiveType(type)
    setActiveCategory('all')
  }

  const filtered = troops.filter(t => {
    if (activeType !== 'all' && t.troopType !== activeType) return false
    if (activeCategory !== 'all' && t.category?.slug !== activeCategory) return false
    return true
  })

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* 麵包屑 */}
        <nav className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">兵種圖鑑</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard mb-6">
          兵種圖鑑
        </h1>

        {/* 篩選區 */}
        {!loading && troops.length > 0 && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 md:p-5 mb-6 space-y-4">
            {/* 第一層：兵種類型 */}
            <div>
              <p className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">兵種類型</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTypeChange('all')}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors rounded ${
                    activeType === 'all' ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                  }`}>
                  全部
                </button>
                {availableTypes.map(type => (
                  <button key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors rounded ${
                      activeType === type ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}>
                    {TROOP_TYPE_LABELS[type] || type}
                  </button>
                ))}
              </div>
            </div>

            {/* 第二層：細分分類（只在有多個分類時顯示） */}
            {availableCategories.length > 1 && (
              <div>
                <p className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">細分類別</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors rounded ${
                      activeCategory === 'all' ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}>
                    全部
                  </button>
                  {availableCategories.map(cat => (
                    <button key={cat.slug}
                      onClick={() => setActiveCategory(cat.slug)}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors rounded ${
                        activeCategory === cat.slug ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 兵種列表 */}
        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">
            {troops.length === 0 ? '暫無兵種資料' : '無符合篩選條件的兵種'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filtered.map(troop => (
              <Link
                key={troop.id}
                href={`/wiki/troops/${troop.category.slug}/${troop.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-xl overflow-hidden group block hover:border-wiki-accent transition-all hover:shadow-lg hover:shadow-wiki-accent/20"
              >
                {/* 圖片區 */}
                <div className="relative h-36 sm:h-44 bg-wiki-darker overflow-hidden">
                  {troop.image ? (
                    <img src={troop.image} alt={troop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: troop.imagePosition || '50% 50%' }} />
                  ) : troop.icon ? (
                    <img src={troop.icon} alt={troop.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: troop.iconPosition || '50% 50%' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-wiki-text-muted">{troop.name[0]}</span>
                    </div>
                  )}
                  {/* 類型標籤 */}
                  {troop.troopType && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-xs font-bold bg-black/50 text-white rounded">
                      {TROOP_TYPE_LABELS[troop.troopType] || troop.troopType}
                    </span>
                  )}
                </div>

                {/* 底部名字 + 分類 */}
                <div className="px-3 py-2.5">
                  <p className="font-bold text-sm text-wiki-text group-hover:text-wiki-accent transition-colors truncate">
                    {troop.name}
                  </p>
                  {troop.category?.name && (
                    <p className="text-xs text-wiki-text-muted mt-0.5 truncate">{troop.category.name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
