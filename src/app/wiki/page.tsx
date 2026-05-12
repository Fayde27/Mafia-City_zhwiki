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
    name: '角色图鉴',
    slug: 'characters',
    description: '查看游戏内所有角色的详细信息，包括属性、技能、阵容搭配等',
    icon: '👤',
    route: '/wiki/characters',
    count: 0,
    countLabel: '名角色',
  },
  {
    id: 'buildings',
    name: '建筑图鉴',
    slug: 'buildings',
    description: '了解各类建筑的功能、升级需求和产出效果',
    icon: '🏠',
    route: '/wiki/buildings',
    count: 0,
    countLabel: '座建筑',
  },
  {
    id: 'equipment',
    name: '装备图鉴',
    slug: 'equipment',
    description: '浏览武器装备的属性、强化方式和获取途径',
    icon: '⚔️',
    route: '/wiki/equipment',
    count: 0,
    countLabel: '件装备',
  },
  {
    id: 'items',
    name: '道具图鉴',
    slug: 'items',
    description: '查询道具用途、合成配方和使用效果',
    icon: '🎁',
    route: '/wiki/items',
    count: 0,
    countLabel: '个道具',
  },
  {
    id: 'troops',
    name: '兵种图鉴',
    slug: 'troops',
    description: '了解各兵种的特点、克制关系和搭配策略',
    icon: '🛡️',
    route: '/wiki/troops',
    count: 0,
    countLabel: '种兵种',
  },
]

export default function WikiIndexPage() {
  const [loading, setLoading] = useState(true)
  const { isAdmin, isLoaded } = useAdminAuth()

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
        <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">图鉴</span>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
              图鉴
            </h1>
            <p className="text-wiki-text-muted text-sm mt-2">选择图鉴类型，浏览游戏内容</p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/wiki-categories"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
            >
              管理分类
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
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
                    {category.count > 0 ? `${category.count} ${category.countLabel}` : '即将上线'}
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
