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
    id: 'characters',
    name: '角色圖鑑',
    slug: 'characters',
    description: '查看遊戲內所有角色的詳細信息，包括屬性、技能、陣容搭配等',
    icon: '👤',
    route: '/wiki/characters',
    count: 0,
    countLabel: '名角色',
  },
  {
    id: 'buildings',
    name: '建築圖鑑',
    slug: 'buildings',
    description: '瞭解各類建築的功能、升級需求和產出效果',
    icon: '🏠',
    route: '/wiki/buildings',
    count: 0,
    countLabel: '座建築',
  },
  {
    id: 'equipment',
    name: '裝備圖鑑',
    slug: 'equipment',
    description: '瀏覽武器裝備的屬性、強化方式和獲得途徑',
    icon: '⚔️',
    route: '/wiki/equipment',
    count: 0,
    countLabel: '件裝備',
  },
  {
    id: 'items',
    name: '道具圖鑑',
    slug: 'items',
    description: '查詢道具用途、合成配方和使用效果',
    icon: '🎁',
    route: '/wiki/items',
    count: 0,
    countLabel: '個道具',
  },
  {
    id: 'troops',
    name: '兵種圖鑑',
    slug: 'troops',
    description: '瞭解各兵種的特點、剋制關係和搭配策略',
    icon: '🛡️',
    route: '/wiki/troops',
    count: 0,
    countLabel: '種兵種',
  },
]

export default function WikiIndexPage() {
  const [loading, setLoading] = useState(true)
  const { isLoaded } = useAdminAuth()

  useEffect(() => {
    fetch('/api/wiki/characters/categories')
      .then(res => res.json())
      .then(data => {
        const totalChars = data?.reduce((sum: number, cat: any) => sum + (cat._count?.characters || 0), 0) || 0
        wikiCategories[0].count = totalChars
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
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
