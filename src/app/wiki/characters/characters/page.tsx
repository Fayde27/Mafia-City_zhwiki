'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface CharacterCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  _count: {
    characters: number
  }
}

export default function CharactersWikiPage() {
  const { isAdmin, isLoaded } = useAdminAuth()
  const [categories, setCategories] = useState<CharacterCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wiki/characters/categories')
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
    <div className="min-h-screen bg-white">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-gray-900-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-[#e8c547]">首页</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-[#e8c547]">图鉴</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">角色图鉴</span>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-[#e8c547] heading-hard">
              角色图鉴
            </h1>
            <p className="text-gray-900-muted text-sm mt-2">选择角色分类，查看详细信息</p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/character-categories"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
            >
              管理分类
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-900-muted">加载中...</div>
        ) : categories.length === 0 ? (
          <div className="card-hard rounded-lg p-8 md:p-12 text-center text-gray-900-muted">
            暂无角色分类
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/wiki/characters/${category.slug}`}
                className="card-hard rounded-lg p-6 md:p-8 hover:border-wiki-accent transition-all group block"
              >
                <div className="text-4xl md:text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wider group-hover:text-[#e8c547] transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-900-muted text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[#e8c547] text-sm font-bold">
                    {category._count.characters} 名角色
                  </span>
                  <span className="text-[#e8c547] text-lg group-hover:translate-x-1 transition-transform">→</span>
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
