'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Building {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  rarity: number
  type: string
  function: string
  level: number
  maxLevel: number
  cost: string
  production: string
  description: string
  category: {
    name: string
    slug: string
  }
}

interface BuildingCategory {
  id: string
  name: string
  slug: string
  icon: string
}

interface BuildingFilterOption {
  id: string
  type: string
  value: string
  sortOrder: number
}

export default function BuildingListPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const { isAdmin, isLoaded } = useAdminAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [category, setCategory] = useState<BuildingCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterRarity, setFilterRarity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterOptions, setFilterOptions] = useState<BuildingFilterOption[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/buildings?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/buildings/categories').then(res => res.json()),
      fetch('/api/admin/building-filters').then(res => res.json()),
    ]).then(([buildingData, catData, filterData]) => {
      const bldgs = buildingData?.buildings || []
      setBuildings(bldgs)
      
      const cat = catData?.find((c: BuildingCategory) => c.slug === categorySlug)
      setCategory(cat || null)
      
      const filters = Array.isArray(filterData) ? filterData : []
      setFilterOptions(filters)
      
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [categorySlug])

  const filteredBuildings = buildings.filter(b => {
    if (filterRarity !== 'all' && b.rarity !== parseInt(filterRarity)) return false
    if (filterType !== 'all' && b.type !== filterType) return false
    return true
  })

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  const rarityOptions = filterOptions.filter(o => o.type === 'rarity')
  const typeOptions = filterOptions.filter(o => o.type === 'type')

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">图鉴</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/buildings" className="hover:text-wiki-accent">建筑图鉴</Link>
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
              href="/admin/buildings"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
            >
              管理建筑
            </Link>
          )}
        </div>

        {(rarityOptions.length > 0 || typeOptions.length > 0) && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-4 md:p-6 mb-6 space-y-4">
            {rarityOptions.length > 0 && (
              <div>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">稀有度</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterRarity('all')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      filterRarity === 'all'
                        ? 'bg-wiki-accent text-wiki-darker'
                        : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}
                  >
                    全部
                  </button>
                  {rarityOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterRarity(opt.value)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        filterRarity === opt.value
                          ? 'bg-wiki-accent text-wiki-darker'
                          : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}
                    >
                      {getRarityStars(parseInt(opt.value))}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {typeOptions.length > 0 && (
              <div>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">建筑类型</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      filterType === 'all'
                        ? 'bg-wiki-accent text-wiki-darker'
                        : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}
                  >
                    全部
                  </button>
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterType(opt.value)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        filterType === opt.value
                          ? 'bg-wiki-accent text-wiki-darker'
                          : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : filteredBuildings.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            该分类下暂无建筑
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredBuildings.map((building) => (
              <Link
                key={building.id}
                href={`/wiki/buildings/${categorySlug}/${building.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg overflow-hidden group block hover:border-wiki-accent transition-all"
              >
                <div className="relative w-full aspect-[3/1] overflow-hidden bg-gradient-to-br from-wiki-gray to-wiki-darker">
                  {building.image ? (
                    <img
                      src={building.image}
                      alt={building.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: building.imagePosition || '50% 50%' }}
                    />
                  ) : building.icon ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">{building.icon}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-wiki-text-muted">{building.name[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    <span className="text-yellow-400 text-sm font-bold drop-shadow-lg">
                      {getRarityStars(building.rarity)}
                    </span>
                  </div>
                  {building.type && (
                    <div className="absolute top-3 right-3">
                      <span className="text-wiki-text text-xs font-bold drop-shadow-lg">
                        {building.type}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-lg md:text-xl font-bold text-wiki-text mb-1 group-hover:text-wiki-accent transition-colors">
                    {building.name}
                  </h3>
                  {building.function && (
                    <p className="text-wiki-text-muted text-sm mb-2">{building.function}</p>
                  )}
                  {building.description && (
                    <p className="text-wiki-text-muted text-xs mt-2 line-clamp-2">
                      {building.description}
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
