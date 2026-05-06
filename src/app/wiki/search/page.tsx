'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Article {
  id: string
  title: string
  slug: string
  summary: string
  category: {
    name: string
    slug: string
  }
  views: number
  createdAt: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      fetch(`/api/wiki/articles?search=${encodeURIComponent(query)}&limit=50`)
        .then(res => res.json())
        .then(data => {
          setArticles(data.articles)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [query])

  return (
    <div className="min-h-screen bg-white">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-sm text-gray-900-muted mb-6">
          <Link href="/" className="hover:text-[#e8c547]">首页</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">搜索: {query}</span>
        </div>

        <h1 className="text-3xl font-heading font-bold text-[#e8c547] heading-hard mb-8">
          搜索结果: {query}
        </h1>

        {loading ? (
          <div className="text-center py-12 text-gray-900-muted">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="card-hard rounded-lg p-12 text-center text-gray-900-muted">
            没有找到相关文章
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-900-muted mb-4">找到 {articles.length} 篇文章</p>
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="card-hard rounded-lg p-6 block transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <div className="text-[#e8c547] text-xs font-bold uppercase tracking-wider mb-2">
                  {article.category.name}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {article.title}
                </h3>
                <p className="text-gray-900-muted text-sm mb-4 line-clamp-2">
                  {article.summary}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-900-muted">
                  <span>{new Date(article.createdAt).toLocaleDateString('zh-TW')}</span>
                  <span>👁 {article.views}</span>
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
