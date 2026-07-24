'use client'

export const runtime = 'edge'

import { useState, useEffect, useMemo } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'

interface ItemT {
  id: string
  name: string
  slug: string
  summary?: string
  icon: string
  iconPosition?: string
  image: string
  imagePosition?: string
  category?: { name: string; slug: string }
}

export default function ItemsWikiPage() {
  const [items, setItems] = useState<ItemT[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    fetch('/api/wiki/items')
      .then(res => res.json())
      .then(data => {
        setItems(data?.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach(i => { if (i.category?.slug) map.set(i.category.slug, i.category.name) })
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }))
  }, [items])

  const filtered = catFilter ? items.filter(i => i.category?.slug === catFilter) : items

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">道具介紹</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">道具介紹</h1>
          <p className="text-wiki-text-muted text-sm mt-2">稀有道具的用途、獲取途徑與關聯活動</p>
        </div>

        {/* 分類篩選 */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setCatFilter('')} className={`px-4 py-1.5 rounded-full text-sm border ${!catFilter ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`}>全部</button>
            {categories.map(c => (
              <button key={c.slug} onClick={() => setCatFilter(c.slug)} className={`px-4 py-1.5 rounded-full text-sm border ${catFilter === c.slug ? 'border-wiki-accent bg-wiki-accent/10 text-wiki-accent' : 'border-wiki-border text-wiki-text-muted'}`}>{c.name}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">暫無道具</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filtered.map(item => (
              <Link key={item.id} href={`/wiki/items/${item.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-xl overflow-hidden group block hover:border-wiki-accent transition-all hover:shadow-md">
                <div className="relative aspect-square bg-wiki-gray overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: item.imagePosition || '50% 50%' }} />
                  ) : item.icon ? (
                    <img src={item.icon} alt={item.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" style={{ objectPosition: item.iconPosition || '50% 50%' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-4xl text-wiki-text-muted">{item.name[0]}</span></div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-wiki-text group-hover:text-wiki-accent transition-colors line-clamp-1">{item.name}</h3>
                  {item.summary && <p className="text-wiki-text-muted text-xs mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>}
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
