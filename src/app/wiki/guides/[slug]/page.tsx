'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Article {
  id: string
  title: string
  slug: string
  summary: string
  coverImage: string
  categoryId: string
  category: {
    name: string
    slug: string
  }
  isPublished: boolean
  isPinned: boolean
  badges: string
  views: number
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

export default function GuideCategoryPage() {
  const params = useParams()
  const categorySlug = params?.slug as string
  const { isAdmin, isLoaded } = useAdminAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/wiki/articles?category=${categorySlug}`).then(res => res.json()),
      fetch('/api/wiki/categories').then(res => res.json()),
    ]).then(([articleData, catData]) => {
      const arts = articleData?.articles || []
      setArticles(arts)
      
      const cat = catData?.find((c: Category) => c.slug === categorySlug)
      setCategory(cat || null)
      
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [categorySlug])

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/guides" className="hover:text-wiki-accent">玩法攻略</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{category?.name || '載入中...'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{category?.icon}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
                {category?.name}
              </h1>
              {category?.description && (
                <p className="text-wiki-text-muted text-sm mt-1">{category.description}</p>
              )}
            </div>
          </div>
          {isAdmin && (
            <Link
              href="/admin/articles/new"
              className="px-4 py-2 bg-wiki-accent text-wiki-darker font-bold text-sm hover:opacity-90"
            >
              + 新增文章
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : articles.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            該分類下暫無攻略文章
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="block group"
              >
                <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 md:p-5 hover:border-wiki-accent transition-all duration-300">
                  <div className="flex gap-4">
                    {article.coverImage ? (
                      <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 rounded-lg bg-wiki-gray flex items-center justify-center">
                        <span className="text-2xl text-wiki-text-muted">
                          {article.category?.name?.charAt(0) || '📄'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-wiki-accent text-xs font-bold">{article.category?.name}</span>
                        {article.isPinned && (
                          <span className="px-2 py-0.5 bg-wiki-danger/10 text-wiki-danger text-xs rounded">
                            置頂
                          </span>
                        )}
                        {article.badges &&
                          article.badges
                            .split(',')
                            .filter(Boolean)
                            .map((badge) => {
                              const badgeStyle =
                                badge === 'HOT'
                                  ? 'bg-wiki-danger/10 text-wiki-danger'
                                  : badge === 'NEW'
                                  ? 'bg-wiki-accent/10 text-wiki-accent'
                                  : 'bg-blue-500/10 text-blue-500'
                              return (
                                <span
                                  key={badge}
                                  className={`px-2 py-0.5 text-xs rounded ${badgeStyle}`}
                                >
                                  {badge}
                                </span>
                              )
                            })}
                      </div>
                      <h3 className="text-wiki-text font-bold text-sm md:text-base mb-1 line-clamp-1 group-hover:text-wiki-accent transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-wiki-text-muted text-xs md:text-sm line-clamp-2 mb-2">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-wiki-text-secondary">
                        <span>
                          {new Date(article.createdAt).toLocaleDateString('zh-TW')}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {article.views}
                        </span>
                      </div>
                    </div>
                  </div>
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
