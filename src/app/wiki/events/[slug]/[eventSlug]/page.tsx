'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'
import SectionCard from '@/components/SectionCard'

interface EventItem {
  id: string
  likes?: number
  name: string
  slug: string
  summary?: string
  icon: string
  iconPosition?: string
  image: string
  imagePosition?: string
  condition?: string
  gameplay?: string
  rewards?: string
  relatedArticles?: { id: string; title: string; slug: string }[]
  category: { name: string; slug: string }
}

export default function EventDetailPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const eventSlug = params?.eventSlug as string
  const [event, setEvent] = useState<EventItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/wiki/events?category=${categorySlug}&slug=${eventSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.events?.length > 0) setEvent(data.events[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categorySlug, eventSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
        <WikiFooter />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">活動不存在</div>
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
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6 flex flex-wrap items-center gap-y-1">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/events" className="hover:text-wiki-accent">活動一覽</Link>
          <span className="mx-2">/</span>
          <Link href={`/wiki/events/${event.category.slug}`} className="hover:text-wiki-accent">{event.category.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{event.name}</span>
        </div>

        {/* Banner 大圖 */}
        {event.image ? (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6 md:mb-8">
            <img src={event.image} alt={event.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: event.imagePosition || '50% 50%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 md:bottom-8 md:left-8">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white drop-shadow-xl mb-1">
                {event.name}
              </h1>
              {event.summary && <p className="text-white/85 text-sm md:text-base">{event.summary}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 mb-6">
            {event.icon && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                <img src={event.icon} alt={event.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: event.iconPosition || '50% 50%' }} />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-wiki-text">{event.name}</h1>
              {event.summary && <p className="text-wiki-text-muted mt-1 text-sm">{event.summary}</p>}
            </div>
          </div>
        )}

        {/* 有 Banner 時，下方顯示小圖標 */}
        {event.image && event.icon && (
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-wiki-border bg-wiki-gray flex-shrink-0">
              <img src={event.icon} alt={event.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: event.iconPosition || '50% 50%' }} />
            </div>
          </div>
        )}

        {/* 各內容模塊 — 統一標題卡片格式 */}
        {event.summary && (
          <SectionCard title="活動簡介"><MarkdownRenderer content={event.summary} /></SectionCard>
        )}
        {event.condition && (
          <SectionCard title="參與條件"><MarkdownRenderer content={event.condition} /></SectionCard>
        )}
        {event.gameplay && (
          <SectionCard title="活動玩法"><MarkdownRenderer content={event.gameplay} /></SectionCard>
        )}
        {event.rewards && (
          <SectionCard title="活動獎勵"><MarkdownRenderer content={event.rewards} /></SectionCard>
        )}
        {event.relatedArticles && event.relatedArticles.length > 0 && (
          <SectionCard title="相關攻略">
            <ul className="space-y-2">
              {event.relatedArticles.map(art => (
                <li key={art.id}>
                  <Link href={`/wiki/article/${art.slug}`}
                    className="flex items-center gap-2 text-wiki-text hover:text-wiki-accent transition-colors group">
                    <span className="text-wiki-accent">📄</span>
                    <span className="group-hover:underline">{art.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* 點贊 */}
        <div className="mt-8 flex justify-center">
          <LikeButton entityType="event" entityId={event.id} initialLikes={event.likes || 0} />
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
