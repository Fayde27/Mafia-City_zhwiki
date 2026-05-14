'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Equipment {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  imagePosition?: string
  iconPosition?: string
  rarity: number
  type: string
  slot: string
  attack: number
  defense: number
  hp: number
  speed: number
  skill: string
  description: string
  category: {
    name: string
    slug: string
  }
}

interface EquipmentCategory {
  id: string
  name: string
  slug: string
  icon: string
}

interface EquipmentFilterOption {
  id: string
  type: string
  value: string
  sortOrder: number
}

export default function EquipmentListPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const { isAdmin, isLoaded } = useAdminAuth()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [category, setCategory] = useState<EquipmentCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<EquipmentFilterOption[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/equipment?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/equipment/categories').then(res => res.json()),
      fetch('/api/admin/equipment-filters').then(res => res.json()),
    ]).then(([equipData, catData, filterData]) => {
      const equips = equipData?.equipment || []
      setEquipment(equips)
      
      const cat = catData?.find((c: EquipmentCategory) => c.slug === categorySlug)
      setCategory(cat || null)
      
      const filters = Array.isArray(filterData) ? filterData : []
      setFilterOptions(filters)
      
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [categorySlug])

  const filteredEquipment = equipment.filter(e => Object.entries(activeFilters).every(([type, value]) => {
    if (!value || value === 'all') return true
    if (type === 'rarity') return e.rarity === parseInt(value)
    return Object.values(b as any).some(v => String(v) === value)
  }))

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
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">图鉴</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/equipment" className="hover:text-wiki-accent">装备图鉴</Link>
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
              href="/admin/equipment"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
            >
              管理装备
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
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : filteredEquipment.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            该分类下暂无装备
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredEquipment.map((item) => (
              <Link
                key={item.id}
                href={`/wiki/equipment/${categorySlug}/${item.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg overflow-hidden group block hover:border-wiki-accent transition-all"
              >
                <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-wiki-gray to-wiki-darker">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: item.imagePosition || '50% 50%' }}
                    />
                  ) : item.icon ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">{item.icon}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-wiki-text-muted">{item.name[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    <span className="text-yellow-400 text-sm font-bold drop-shadow-lg">
                      {getRarityStars(item.rarity)}
                    </span>
                  </div>
                  {item.type && (
                    <div className="absolute top-3 right-3">
                      <span className="text-wiki-text text-xs font-bold drop-shadow-lg">
                        {item.type}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-lg md:text-xl font-bold text-wiki-text mb-1 group-hover:text-wiki-accent transition-colors">
                    {item.name}
                  </h3>
                  {item.slot && (
                    <p className="text-wiki-text-muted text-sm mb-2">部位：{item.slot}</p>
                  )}
                  {item.description && (
                    <p className="text-wiki-text-muted text-xs mt-2 line-clamp-2">
                      {item.description}
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
