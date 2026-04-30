'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Article {
  id: string
  title: string
  slug: string
  content: string
  summary: string
  isPinned: boolean
  badges: string
  category: {
    name: string
    slug: string
  }
  tags: string
  views: number
  createdAt: string
  updatedAt: string
}

export default function ArticleDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { isAdmin } = useAdminAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/wiki/articles?slug=${slug}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          setArticle(data.articles[0])
        }
        setLoading(false)
      })
  }, [slug])

  return (
    <div className="min-h-screen bg-wiki-dark">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-sm text-wiki-text-muted mb-6">
          <Link href="/" className="hover:text-wiki-accent">首页</Link>
          <span className="mx-2">/</span>
          {article && (
            <>
              <Link href={`/wiki/${article.category.slug}`} className="hover:text-wiki-accent">
                {article.category.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-wiki-text">{article?.title || '加载中...'}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : !article ? (
          <div className="card-hard rounded-lg p-12 text-center text-wiki-text-muted">
            文章不存在
          </div>
        ) : (
          <article className="card-hard rounded-lg p-8">
            <header className="mb-8 pb-6 border-b border-wiki-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {article.isPinned && (
                      <span className="px-2 py-0.5 bg-wiki-danger/20 text-wiki-danger text-xs font-bold border border-wiki-danger/40">
                        置顶
                      </span>
                    )}
                    {article.badges && article.badges.split(',').filter(Boolean).map((badge) => {
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
                  <h1 className="text-4xl font-heading font-bold text-wiki-accent heading-hard mb-4">
                    {article.title}
                  </h1>
                  <div className="flex items-center gap-6 text-sm text-wiki-text-muted">
                    <span>分类: {article.category.name}</span>
                    <span>👁 {article.views} 浏览</span>
                    <span>更新于 {new Date(article.updatedAt).toLocaleDateString('zh-TW')}</span>
                  </div>
                  {article.tags && (
                    <div className="flex gap-2 mt-4">
                      {article.tags.split(',').map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <Link href={`/admin/articles/edit/${article.id}`} className="btn-hard text-white text-sm flex-shrink-0">
                    编辑文章
                  </Link>
                )}
              </div>
            </header>

            <div className="prose prose-invert max-w-none">
              <MarkdownRenderer content={article.content} />
            </div>
          </article>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
