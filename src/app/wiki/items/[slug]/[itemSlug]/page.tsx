'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'

interface Item {
  id: string
  likes?: number
  name: string
  slug: string
  summary?: string
  icon: string
  iconPosition?: string
  image: string
  imagePosition?: string
  source?: string
  description?: string
  usage?: string
  recipe?: string
  category: { name: string; slug: string }
}

export default function ItemDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const itemSlug = params?.itemSlug as string
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    fetch(`/api/wiki/items?category=${categorySlug}&slug=${itemSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.items?.length > 0) setItem(data.items[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categorySlug, itemSlug])

  const tabs = [
    { id: 'description', label: '道具詳情', show: !!item?.description },
    { id: 'source',      label: '獲取途徑',  show: !!item?.source },
    { id: 'usage',       label: '使用方法', show: !!item?.usage },
    { id: 'recipe',      label: '合成配方', show: !!item?.recipe },
  ].filter(t => t.show)

  // 選第一個有內容的 tab
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [item])

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
        <WikiFooter />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">道具不存在</div>
        </main>
        <WikiFooter />
      </div>
    )
  }

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
          <Link href={`/wiki/items/${item.category.slug}`} className="hover:text-wiki-accent">
            {item.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{item.name}</span>
        </div>

        {/* Banner 大圖 */}
        {item.image && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6 md:mb-8">
            <img src={item.image} alt={item.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: item.imagePosition || '50% 50%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 md:bottom-8 md:left-8">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white drop-shadow-xl mb-1">
                {item.name}
              </h1>
              {item.summary && (
                <p className="text-white/80 text-sm md:text-base">{item.summary}</p>
              )}
            </div>
          </div>
        )}

        {/* 無 Banner 時的標題區 */}
        {!item.image && (
          <div className="flex items-center gap-4 mb-6">
            {item.icon && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                <img src={item.icon} alt={item.name}
                  className="w-full h-full object-contain p-1"
                  style={{ objectPosition: item.iconPosition || '50% 50%' }} />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-wiki-text">{item.name}</h1>
              {item.summary && <p className="text-wiki-text-muted mt-1 text-sm">{item.summary}</p>}
            </div>
          </div>
        )}

        {/* 有 Banner 時，Banner 下方顯示圖標+簡介 */}
        {item.image && (
          <div className="flex items-center gap-4 mb-5">
            {item.icon && (
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-wiki-border bg-wiki-gray flex-shrink-0">
                <img src={item.icon} alt={item.name}
                  className="w-full h-full object-contain p-1"
                  style={{ objectPosition: item.iconPosition || '50% 50%' }} />
              </div>
            )}
            {item.summary && !item.image && (
              <p className="text-wiki-text-muted text-sm">{item.summary}</p>
            )}
          </div>
        )}

        {/* Tab 切換 + 內容 */}
        {tabs.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold whitespace-nowrap rounded transition-colors ${
                    activeTab === tab.id
                      ? 'bg-wiki-accent text-wiki-darker'
                      : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 md:p-7">
              {activeTab === 'description' && item.description && (
                <MarkdownRenderer content={item.description} />
              )}
              {activeTab === 'source' && item.source && (
                <MarkdownRenderer content={item.source} />
              )}
              {activeTab === 'usage' && item.usage && (
                <MarkdownRenderer content={item.usage} />
              )}
              {activeTab === 'recipe' && item.recipe && (
                <MarkdownRenderer content={item.recipe} />
              )}
            </div>
          </>
        )}

        {/* 點贊 */}
        <div className="mt-8 flex justify-center">
          <LikeButton entityType="item" entityId={item.id} initialLikes={item.likes || 0} />
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
