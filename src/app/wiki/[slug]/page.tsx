'use client'

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
  isPublished: boolean
  isPinned: boolean
  badges: string
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
  const { isAdmin } = useAdminAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    fetch(`/api/wiki/articles?category=${categorySlug}&limit=50`)
      .then(res => res.json())
      .then(data => {
        const articles = data?.articles || []
        setArticles(articles)
        if (articles.length > 0) {
          setCategoryName(articles[0].category.name)
        }
        setLoading(false)
      })
      .catch(() => {
        setArticles([])
        setLoading(false)
      })
  }, [categorySlug])

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return
    try {
      await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
      setArticles(articles.filter(a => a.id !== id))
    } catch (err) {
      alert('删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-wiki-dark">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">{categoryName}</span>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">
            {categoryName}
          </h1>
          {isAdmin && (
            <Link href={`/admin/articles/new?category=${categorySlug}`} className="btn-hard text-white text-sm">
              + 新增文章
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="card-hard rounded-lg p-8 md:p-12 text-center text-wiki-text-muted">
            该分类下暂无文章
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {articles.map((article) => (
              <div key={article.id} className="card-hard rounded-lg p-4 md:p-6 relative group">
                <Link href={`/wiki/article/${article.slug}`} className="block">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base md:text-xl font-bold text-wiki-text line-clamp-2 flex-1">
                      {article.title}
                    </h3>
                    {article.isPinned && (
                      <span className="px-2 py-0.5 bg-wiki-danger/20 text-wiki-danger text-xs font-bold border border-wiki-danger/40 flex-shrink-0">
                        置顶
                      </span>
                    )}
                  </div>
                  {article.badges && article.badges.split(',').filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {article.badges.split(',').filter(Boolean).map((badge) => {
                        const badgeStyle = badge === 'HOT' ? 'bg-wiki-danger/20 text-wiki-danger border-wiki-danger/40'
                          : badge === 'NEW' ? 'bg-wiki-accent/20 text-wiki-accent border-wiki-accent/40'
                          : badge === 'STAR' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                          : 'bg-wiki-accent/10 text-wiki-accent border-wiki-accent/30'
                        return (
                          <span key={badge} className={`px-2 py-0.5 text-xs font-bold border ${badgeStyle}`}>
                            {badge}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <p className="text-wiki-text-muted text-sm mb-3 md:mb-4 line-clamp-3">
                    {article.summary}
                  </p>
                  <div className="flex justify-between items-center text-xs text-wiki-text-muted">
                    <span>{new Date(article.createdAt).toLocaleDateString('zh-TW')}</span>
                    <span>👁 {article.views}</span>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/articles/edit/${article.id}`} className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold hover:bg-wiki-accent/30">
                      编辑
                    </Link>
                    <button onClick={() => handleDeleteArticle(article.id)} className="px-2 py-1 bg-wiki-danger/20 text-wiki-danger text-xs font-bold hover:bg-wiki-danger/30">
                      删除
                    </button>
                  </div>
                )}
                {!article.isPublished && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-wiki-danger/80 text-white text-xs font-bold">
                    草稿
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
