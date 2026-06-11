'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Item {
  id: string
  name: string
  slug: string
  summary?: string
  icon: string
  iconPosition?: string
  image: string
  imagePosition?: string
  category: { name: string; slug: string }
}

interface ItemCategory {
  id: string; name: string; slug: string; icon: string
}

interface ItemFilterOption {
  id: string; type: string; value: string; sortOrder: number
}

export default function ItemListPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const { isAdmin } = useAdminAuth()
  const [items, setItems] = useState<Item[]>([])
  const [category, setCategory] = useState<ItemCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<ItemFilterOption[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/items?category=${categorySlug}`).then(r => r.json()),
      fetch('/api/wiki/items/categories').then(r => r.json()),
      fetch(`/api/wiki/items/filter-options?categorySlug=${categorySlug}`).then(r => r.json()),
    ]).then(([itemData, catData, filterData]) => {
      setItems(itemData?.items || [])
      setCategory((Array.isArray(catData) ? catData : []).find((c: ItemCategory) => c.slug === categorySlug) || null)
      setFilterOptions(Array.isArray(filterData) ? filterData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [categorySlug])

  const filterTypes = Array.from(new Set(filterOptions.map(o => o.type)))
  const groupedFilters: Record<string, ItemFilterOption[]> = {}
  filterTypes.forEach(type => {
    groupedFilters[type] = filterOptions.filter(o => o.type === type).sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const filteredItems = items.filter(i =>
    Object.entries(activeFilters).every(([, value]) => !value || value === 'all')
  )

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* 麵包屑 */}
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/items" className="hover:text-wiki-accent">道具圖鑑</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{category?.name || '載入中...'}</span>
        </div>

        {/* 頁頭 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {category?.icon && <span className="text-3xl">{category.icon}</span>}
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              {category?.name}
            </h1>
          </div>
          {isAdmin && (
            <Link href="/admin/items"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90">
              管理道具
            </Link>
          )}
        </div>

        {/* 篩選欄 */}
        {filterTypes.length > 0 && (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 mb-6 space-y-3">
            {filterTypes.map(type => (
              <div key={type}>
                <div className="text-xs font-bold text-wiki-accent uppercase tracking-wider mb-2">{type}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilters(prev => ({ ...prev, [type]: 'all' }))}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                      !activeFilters[type] || activeFilters[type] === 'all'
                        ? 'bg-wiki-accent text-wiki-darker'
                        : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                    }`}>全部</button>
                  {groupedFilters[type].map(opt => (
                    <button key={opt.id}
                      onClick={() => setActiveFilters(prev => ({ ...prev, [type]: opt.value }))}
                      className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                        activeFilters[type] === opt.value
                          ? 'bg-wiki-accent text-wiki-darker'
                          : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                      }`}>
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 道具列表 */}
        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">
            該分類下暫無道具
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredItems.map(item => (
              <Link key={item.id}
                href={`/wiki/items/${categorySlug}/${item.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-xl overflow-hidden group block hover:border-wiki-accent transition-all hover:shadow-md">
                {/* 圖片區 */}
                <div className="relative aspect-square bg-wiki-gray overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: item.imagePosition || '50% 50%' }} />
                  ) : item.icon ? (
                    <img src={item.icon} alt={item.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: item.iconPosition || '50% 50%' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-wiki-text-muted">{item.name[0]}</span>
                    </div>
                  )}
                </div>
                {/* 文字區 */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-wiki-text group-hover:text-wiki-accent transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  {item.summary && (
                    <p className="text-wiki-text-muted text-xs mt-1 line-clamp-2 leading-relaxed">
                      {item.summary}
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
