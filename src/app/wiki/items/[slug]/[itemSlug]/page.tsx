'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface Item {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  rarity: number
  type: string
  quality: string
  stackable: boolean
  effect: string
  description: string
  usage: string
  recipe: string
  source: string
  category: {
    name: string
    slug: string
  }
}

export default function ItemDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const itemSlug = params?.itemSlug as string
  const { isAdmin } = useAdminAuth()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    fetch(`/api/wiki/items?category=${categorySlug}&slug=${itemSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.items && data.items.length > 0) {
          setItem(data.items[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [categorySlug, itemSlug])

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  const tabs = [
    { id: 'description', label: '道具详情' },
    { id: 'usage', label: '使用方法' },
    { id: 'recipe', label: '合成配方' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">加载中...</div>
        <WikiFooter />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-12 text-center text-wiki-text-muted">
            道具不存在
          </div>
        </main>
        <WikiFooter />
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
          <Link href="/wiki" className="hover:text-wiki-accent">图鉴</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/items" className="hover:text-wiki-accent">道具图鉴</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/items/${item.category.slug}`} className="hover:text-wiki-accent">
            {item.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{item.name}</span>
        </div>

        {item.image && (
          <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden mb-6 md:mb-8">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wiki-dark via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg font-bold drop-shadow-lg">
                  {getRarityStars(item.rarity)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-wiki-text heading-hard mb-2">
                {item.name}
              </h1>
              {item.effect && (
                <p className="text-wiki-text-muted text-lg md:text-xl">{item.effect}</p>
              )}
            </div>
            {isAdmin && (
              <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <Link
                  href={`/admin/items/edit/${item.id}`}
                  className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
                >
                  编辑道具
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              {item.icon && (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-wiki-accent flex-shrink-0 bg-wiki-gray flex items-center justify-center">
                  <span className="text-5xl">{item.icon}</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-wiki-text">{item.name}</h2>
                {item.type && (
                  <p className="text-wiki-text-muted mt-1">类型：{item.type}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wider whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-wiki-accent text-wiki-darker'
                      : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 md:p-8">
              {activeTab === 'description' && (
                <div>
                  {item.description && (
                    <MarkdownRenderer content={item.description} />
                  )}
                </div>
              )}
              {activeTab === 'usage' && (
                <div>
                  {item.usage && (
                    <MarkdownRenderer content={item.usage} />
                  )}
                </div>
              )}
              {activeTab === 'recipe' && (
                <div>
                  {item.recipe && (
                    <MarkdownRenderer content={item.recipe} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">道具信息</h3>
              <div className="space-y-3 text-sm">
                {item.rarity && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">稀有度</span>
                    <span className="text-yellow-400 font-bold">{getRarityStars(item.rarity)}</span>
                  </div>
                )}
                {item.type && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">类型</span>
                    <span className="text-wiki-text font-bold">{item.type}</span>
                  </div>
                )}
                {item.quality && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">品质</span>
                    <span className="text-wiki-text">{item.quality}</span>
                  </div>
                )}
                {item.stackable !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">可堆叠</span>
                    <span className="text-wiki-text">{item.stackable ? '是' : '否'}</span>
                  </div>
                )}
                {item.source && (
                  <div className="flex justify-between">
                    <span className="text-wiki-text-muted">来源</span>
                    <span className="text-wiki-text">{item.source}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
