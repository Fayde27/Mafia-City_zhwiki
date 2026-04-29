'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

export default function WikiCategoryPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    fetch(`/api/wiki/articles?category=${categorySlug}&limit=50`)
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles)
        if (data.articles.length > 0) {
          setCategoryName(data.articles[0].category.name)
        }
        setLoading(false)
      })
  }, [categorySlug])

  return (
    <div className="min-h-screen bg-wiki-dark">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <div className="text-sm text-wiki-text-muted mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{categoryName}</span>
        </div>

        <h1 className="text-4xl font-heading font-bold text-wiki-accent heading-hard mb-8">
          {categoryName}
        </h1>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="card-hard rounded-lg p-12 text-center text-wiki-text-muted">
            该分类下暂无文章
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="card-hard rounded-lg p-6 block transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <h3 className="text-xl font-bold text-wiki-text mb-3">
                  {article.title}
                </h3>
                <p className="text-wiki-text-muted text-sm mb-4 line-clamp-3">
                  {article.summary}
                </p>
                <div className="flex justify-between items-center text-xs text-wiki-text-muted">
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
