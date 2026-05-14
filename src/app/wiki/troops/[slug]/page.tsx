'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Troop {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  rarity: number
  type: string
  attack: number
  defense: number
  hp: number
  speed: number
  counter: string
  weakness: string
  description: string
  category: {
    name: string
    slug: string
  }
}

interface TroopCategory {
  id: string
  name: string
  slug: string
  icon: string
}

interface TroopFilterOption {
  id: string
  type: string
  value: string
  sortOrder: number
}

export default function TroopListPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const { isAdmin, isLoaded } = useAdminAuth()
  const [troops, setTroops] = useState<Troop[]>([])
  const [category, setCategory] = useState<TroopCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<TroopFilterOption[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/troops?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/troops/categories').then(res => res.json()),
      fetch('/api/admin/troop-filters').then(res => res.json()),
    ]).then(([troopData, catData, filterData]) => {
      const trps = troopData?.troops || []
      setTroops(trps)
      
      const cat = catData?.find((c: TroopCategory) => c.slug === categorySlug)
      setCategory(cat || null)
      
      const filters = Array.isArray(filterData) ? filterData : []
      setFilterOptions(filters)
      
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [categorySlug])

  const filteredTroops = troops.filter(t => Object.entries(activeFilters).every(([type, value]) => {
    if (!value || value === 'all') return true
    if (type === 'rarity') return t.rarity === parseInt(value)
    return Object.values(t as Record<string, unknown>).some(v => String(v) === value)
  }))

  const getRarityStars = (r: number) => '★'.repeat(r) + '☆'.repeat(5 - r)
  const filterTypes = Array.from(new Set(filterOptions.map(o => o.type)))
  const groupedFilters = filterTypes.reduce((acc, type) => {
    acc[type] = filterOptions.filter(o => o.type === type).sort((a, b) => a.sortOrder - b.sortOrder)
    return acc
  }, {} as Record<string, typeof filterOptions[0][]>)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">图鉴</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/troops" className="hover:text-wiki-accent">兵种图鉴</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{category?.name || '加载中...'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{category?.icon}</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              {category?.name}
            </h1>
          </div>
          {isAdmin && (
            <Link
              href="/admin/troops"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
            >
              管理兵种
            </Link>
          )}
        </div>

        {filterTypes.length > 0 && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-4 md:p-6 mb-6 space-y-4">
            {filterTypes.map(type => (
              <div key={type}>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">{type}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilters(prev => ({ ...prev, [type]: 'all' }))}
                    className={}
                  >全部</button>
                  {groupedFilters[type].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setActiveFilters(prev => ({ ...prev, [type]: opt.value }))}
                      className={}
                    >
                      {type === 'rarity' && !isNaN(parseInt(opt.value)) ? getRarityStars(parseInt(opt.value)) : opt.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : filteredTroops.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            该分类下暂无兵种
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredTroops.map((troop) => (
              <Link
                key={troop.id}
                href={`/wiki/troops/${categorySlug}/${troop.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg overflow-hidden group block hover:border-wiki-accent transition-all"
              >
                <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-wiki-gray to-wiki-darker">
                  {troop.image ? (
                    <img
                      src={troop.image}
                      alt={troop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: troop.imagePosition || '50% 50%' }}
                    />
                  ) : troop.icon ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">{troop.icon}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-wiki-text-muted">{troop.name[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    <span className="text-yellow-400 text-sm font-bold drop-shadow-lg">
                      {getRarityStars(troop.rarity)}
                    </span>
                  </div>
                  {troop.type && (
                    <div className="absolute top-3 right-3">
                      <span className="text-wiki-text text-xs font-bold drop-shadow-lg">
                        {troop.type}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-lg md:text-xl font-bold text-wiki-text mb-1 group-hover:text-wiki-accent transition-colors">
                    {troop.name}
                  </h3>
                  {troop.counter && (
                    <p className="text-wiki-text-muted text-sm mb-2">克制：{troop.counter}</p>
                  )}
                  {troop.description && (
                    <p className="text-wiki-text-muted text-xs mt-2 line-clamp-2">
                      {troop.description}
                    </p>
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
