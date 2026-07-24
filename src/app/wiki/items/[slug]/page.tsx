'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'
import ItemExchangeContent, { parseExchangeContent } from '@/components/ItemExchangeContent'
import SectionCard from '@/components/SectionCard'

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
  isExchange?: boolean
  exchangeContent?: string
  description?: string
  usage?: string
  recipe?: string
  relatedEvents?: { id: string; name: string; slug: string; icon?: string; iconPosition?: string }[]
  category?: { name: string; slug: string }
}

export default function ItemDetailPage() {
  const params = useParams()
  const itemSlug = params?.slug as string
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/wiki/items?slug=${itemSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.items?.length > 0) setItem(data.items[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [itemSlug])

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

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* 麵包屑 */}
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/items" className="hover:text-wiki-accent">道具介紹</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{item.name}</span>
        </div>

        {/* Banner 大圖 */}
        {item.image && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6 md:mb-8">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" style={{ objectPosition: item.imagePosition || '50% 50%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 md:bottom-8 md:left-8">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white drop-shadow-xl mb-1">{item.name}</h1>
              {item.summary && <p className="text-white/80 text-sm md:text-base">{item.summary}</p>}
            </div>
          </div>
        )}

        {/* 無 Banner 時的標題區 */}
        {!item.image && (
          <div className="flex items-center gap-4 mb-6">
            {item.icon && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                <img src={item.icon} alt={item.name} className="w-full h-full object-contain p-1" style={{ objectPosition: item.iconPosition || '50% 50%' }} />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-wiki-text">{item.name}</h1>
              {item.summary && <p className="text-wiki-text-muted mt-1 text-sm">{item.summary}</p>}
            </div>
          </div>
        )}

        {/* 有 Banner 時，下方顯示圖標 */}
        {item.image && item.icon && (
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-wiki-border bg-wiki-gray flex-shrink-0">
              <img src={item.icon} alt={item.name} className="w-full h-full object-contain p-1" style={{ objectPosition: item.iconPosition || '50% 50%' }} />
            </div>
          </div>
        )}

        {/* 各內容模塊 */}
        {item.summary && <SectionCard title="道具簡介"><MarkdownRenderer content={item.summary} /></SectionCard>}
        {item.isExchange && parseExchangeContent(item.exchangeContent) && (
          <SectionCard title="兌換內容"><ItemExchangeContent raw={item.exchangeContent} /></SectionCard>
        )}
        {item.description && <SectionCard title="道具詳情"><MarkdownRenderer content={item.description} /></SectionCard>}
        {item.source && <SectionCard title="獲得途徑"><MarkdownRenderer content={item.source} /></SectionCard>}
        {item.usage && <SectionCard title="使用方法"><MarkdownRenderer content={item.usage} /></SectionCard>}
        {item.recipe && <SectionCard title="合成配方"><MarkdownRenderer content={item.recipe} /></SectionCard>}

        {/* 相關活動（互鏈） */}
        {item.relatedEvents && item.relatedEvents.length > 0 && (
          <SectionCard title="相關活動">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {item.relatedEvents.map(ev => (
                <Link key={ev.id} href={`/wiki/events/${ev.slug}`}
                  className="flex items-center gap-2 p-2 rounded-lg border border-wiki-border hover:border-wiki-accent transition-colors group">
                  <div className="w-10 h-10 rounded bg-wiki-gray overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {ev.icon ? <img src={ev.icon} alt={ev.name} className="w-full h-full object-cover" style={{ objectPosition: ev.iconPosition || '50% 50%' }} /> : <span className="text-lg">🎉</span>}
                  </div>
                  <span className="text-sm text-wiki-text group-hover:text-wiki-accent truncate">{ev.name}</span>
                </Link>
              ))}
            </div>
          </SectionCard>
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
