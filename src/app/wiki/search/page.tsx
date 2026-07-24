'use client'

export const runtime = 'edge'

import { useState, useEffect, Suspense } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface SearchResult {
  type: 'article' | 'item' | 'event' | 'lineup'
  id: string
  name: string
  url: string
  category: string
  icon: string
}

const TYPE_EMOJI: Record<string, string> = { article: '📄', item: '🎁', event: '🎉', lineup: '🎯' }
const TYPE_ORDER = ['lineup', 'item', 'event', 'article']

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      setLoading(true)
      fetch(`/api/wiki/search?q=${encodeURIComponent(query)}&limit=50`)
        .then(res => res.json())
        .then(data => {
          setResults(Array.isArray(data.results) ? data.results : [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [query])

  // 按類型分組，並按固定順序排列
  const grouped = TYPE_ORDER
    .map(t => ({ type: t, items: results.filter(r => r.type === t) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="text-sm text-wiki-text-muted mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">搜索: {query}</span>
        </div>

        <h1 className="text-3xl font-heading font-bold text-wiki-accent heading-hard mb-2">搜索結果: {query}</h1>
        {!loading && <p className="text-wiki-text-muted text-sm mb-8">共找到 {results.length} 條全站結果（陣容 / 道具 / 活動 / 攻略）</p>}

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : results.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">
            沒有找到「{query}」相關的內容
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(group => (
              <section key={group.type}>
                <h2 className="text-wiki-text font-bold text-lg mb-3 flex items-center gap-2">
                  <span>{TYPE_EMOJI[group.type]}</span>
                  {group.items[0].category}
                  <span className="text-wiki-text-muted text-sm font-normal">（{group.items.length}）</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map(r => (
                    <Link key={r.type + r.id} href={r.url}
                      className="flex items-center gap-3 bg-wiki-card border border-wiki-border rounded-xl p-3 hover:border-wiki-accent transition-all group">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-wiki-gray flex items-center justify-center">
                        {r.icon ? <img src={r.icon} alt={r.name} className="w-full h-full object-cover" /> : <span className="text-xl">{TYPE_EMOJI[r.type]}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-wiki-accent">{r.category}</div>
                        <div className="text-sm font-bold text-wiki-text truncate group-hover:text-wiki-accent transition-colors">{r.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">載入中...</div>}>
      <SearchContent />
    </Suspense>
  )
}
