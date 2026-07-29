'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface WikiCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  route: string
  count: number
  countLabel: string
}

const wikiCategories: WikiCategory[] = [
  {
    id: 'lineups',
    name: '豪傑陣容',
    slug: 'lineups',
    description: '運營精選的豪傑陣容方案：武器、戰徽、詞條搭配',
    icon: '🎯',
    route: '/wiki/lineups',
    count: 0,
    countLabel: '套陣容',
  },
  {
    id: 'hero-lineups',
    name: '英雄陣容',
    slug: 'hero-lineups',
    description: '英雄配隊方案：戰寵/異獸、6 格裝備與套裝加成',
    icon: '🦸',
    route: '/wiki/hero-lineups',
    count: 0,
    countLabel: '套陣容',
  },
  {
    id: 'items',
    name: '道具介紹',
    slug: 'items',
    description: '稀有道具的用途、獲取途徑與關聯活動',
    icon: '🎁',
    route: '/wiki/items',
    count: 0,
    countLabel: '個道具',
  },
  {
    id: 'events',
    name: '活動介紹',
    slug: 'events',
    description: '活動玩法、參與條件、獎勵與關聯道具',
    icon: '🎉',
    route: '/wiki/events',
    count: 0,
    countLabel: '個活動',
  },
]

export default function WikiIndexPage() {
  const [loading, setLoading] = useState(true)
  const { isLoaded } = useAdminAuth()

  useEffect(() => {
    setLoading(false)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">圖鑑</span>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              圖鑑
            </h1>
            <p className="text-wiki-text-muted text-sm mt-2">選擇圖鑑類型，瀏覽遊戲內容</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {wikiCategories.map((category) => (
              <Link
                key={category.id}
                href={category.route}
                className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 md:p-8 hover:border-wiki-accent transition-all group block"
              >
                <div className="text-4xl md:text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold text-wiki-text mb-2 uppercase tracking-wider group-hover:text-wiki-accent transition-colors">
                  {category.name}
                </h3>
                <p className="text-wiki-text-muted text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-wiki-accent text-sm font-bold">
                    {category.count > 0 ? `${category.count} ${category.countLabel}` : '即將上線'}
                  </span>
                  <span className="text-wiki-accent text-lg group-hover:translate-x-1 transition-transform">→</span>
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
