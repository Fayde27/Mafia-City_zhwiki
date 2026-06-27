'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'

interface BuildingCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  _count: {
    buildings: number
  }
}

export default function BuildingsWikiPage() {
  const [categories, setCategories] = useState<BuildingCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wiki/buildings/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">建築圖鑑</span>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              建築圖鑑
            </h1>
            <p className="text-wiki-text-muted text-sm mt-2">選擇建築分類，查看詳細信息</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : categories.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            暫無建築分類
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/wiki/buildings/${category.slug}`}
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
                    {category._count.buildings} 座建築
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
