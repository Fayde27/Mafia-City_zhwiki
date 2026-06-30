'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface EventItem {
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

interface EventCategory {
  id: string; name: string; slug: string; icon: string
}

export default function EventListPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const [events, setEvents] = useState<EventItem[]>([])
  const [category, setCategory] = useState<EventCategory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/events?category=${categorySlug}`).then(r => r.json()),
      fetch('/api/wiki/events/categories').then(r => r.json()),
    ]).then(([eventData, catData]) => {
      setEvents(eventData?.events || [])
      setCategory((Array.isArray(catData) ? catData : []).find((c: EventCategory) => c.slug === categorySlug) || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [categorySlug])

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
          <Link href="/wiki/events" className="hover:text-wiki-accent">活動一覽</Link>
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
        </div>

        {/* 活動列表 */}
        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : events.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">
            該分類下暫無活動
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {events.map(event => (
              <Link key={event.id}
                href={`/wiki/events/${categorySlug}/${event.slug}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-xl overflow-hidden group block hover:border-wiki-accent transition-all hover:shadow-md">
                {/* 圖片區 */}
                <div className="relative aspect-square bg-wiki-gray overflow-hidden">
                  {event.image ? (
                    <img src={event.image} alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: event.imagePosition || '50% 50%' }} />
                  ) : event.icon ? (
                    <img src={event.icon} alt={event.name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: event.iconPosition || '50% 50%' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-wiki-text-muted">{event.name[0]}</span>
                    </div>
                  )}
                </div>
                {/* 文字區 */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-wiki-text group-hover:text-wiki-accent transition-colors line-clamp-1">
                    {event.name}
                  </h3>
                  {event.summary && (
                    <p className="text-wiki-text-muted text-xs mt-1 line-clamp-2 leading-relaxed">
                      {event.summary}
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
