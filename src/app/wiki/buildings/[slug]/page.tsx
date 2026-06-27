'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BUILDING_TYPE_LABELS, BUILDING_TYPE_OPTIONS } from '@/lib/building'

interface Building {
  id: string
  name: string
  slug: string
  buildingType?: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  rarity: number
  type: string
  function: string
  summary?: string
  unlockCondition?: string
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
  const [buildings, setBuildings] = useState<Building[]>([])
  const [category, setCategory] = useState<BuildingCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<BuildingFilterOption[]>([])
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/buildings?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/buildings/categories').then(res => res.json()),
      fetch(`/api/wiki/buildings/filter-options?categorySlug=${categorySlug}`).then(res => res.json()),
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

  const filteredBuildings = buildings
    .filter(b => typeFilter === 'all' || (b.buildingType || 'inner') === typeFilter)
    .filter(b => Object.entries(activeFilters).every(([type, value]) => {
      if (!value || value === 'all') return true
      if (type === 'rarity') return b.rarity === parseInt(value)
      return Object.values(b as any).some(v => String(v) === value)
    }))

  // 僅顯示該分類下實際存在的建築類別 Tab
  const availableTypes = BUILDING_TYPE_OPTIONS.filter(t => buildings.some(b => (b.buildingType || 'inner') === t))

  const getRarityStars = (r: number) => '★'.repeat(r) + '☆'.repeat(5 - r)
  const filterTypes = Array.from(new Set(filterOptions.map(o => o.type)))
  const groupedFilters: {[k: string]: typeof filterOptions} = {}
  filterTypes.forEach(type => {
    groupedFilters[type] = filterOptions.filter(o => o.type === type).sort((a, b) => a.sortOrder - b.sortOrder)
  })

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/buildings" className="hover:text-wiki-accent">建築圖鑑</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{category?.name || '載入中...'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{category?.icon}</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              {category?.name}
            </h1>
          </div>
        </div>

        {availableTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setTypeFilter('all')}
              className={typeFilter === 'all' ? 'px-4 py-2 text-sm font-bold bg-wiki-accent text-wiki-darker' : 'px-4 py-2 text-sm font-bold bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}
            >全部類別</button>
            {availableTypes.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={typeFilter === t ? 'px-4 py-2 text-sm font-bold bg-wiki-accent text-wiki-darker' : 'px-4 py-2 text-sm font-bold bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}
              >{BUILDING_TYPE_LABELS[t]}</button>
            ))}
          </div>
        )}

        {filterTypes.length > 0 && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-4 md:p-6 mb-6 space-y-4">
            {filterTypes.map(type => (
              <div key={type}>
                <div className="text-sm font-bold text-wiki-accent uppercase tracking-wider mb-2">{type}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilters(prev => ({ ...prev, [type]: 'all' }))}
                    className={(!activeFilters[type] || activeFilters[type] === 'all') ? 'px-3 py-1.5 text-xs font-bold bg-wiki-accent text-wiki-darker' : 'px-3 py-1.5 text-xs font-bold bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}
                  >全部</button>
                  {groupedFilters[type].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setActiveFilters(prev => ({ ...prev, [type]: opt.value }))}
                      className={activeFilters[type] === opt.value ? 'px-3 py-1.5 text-xs font-bold bg-wiki-accent text-wiki-darker' : 'px-3 py-1.5 text-xs font-bold bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}
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
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : filteredBuildings.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            該分類下暫無建築
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredBuildings.map((building) => (
              <Link
                key={building.id}
                href={`/wiki/buildings/${categorySlug}/${building.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg overflow-hidden group block hover:border-wiki-accent transition-all"
              >
                <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-wiki-gray to-wiki-darker">
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
                    <p className="text-wiki-text-muted text-sm mb-1">{building.function}</p>
                  )}
                  {(building.summary || building.description) && (
                    <p className="text-wiki-text-muted text-xs mt-1 line-clamp-2">
                      {building.summary || building.description?.replace(/<[^>]*>/g, '')}
                    </p>
                  )}
                  {building.unlockCondition && (
                    <p className="text-wiki-accent text-xs mt-1.5">🔓 {building.unlockCondition}</p>
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
