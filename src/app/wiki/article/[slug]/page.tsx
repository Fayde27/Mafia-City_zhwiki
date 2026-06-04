'use client'

export const runtime = 'edge'


import { useState, useEffect, useRef } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import ArticleActionBar from '@/components/ArticleActionBar'
import ImageLightbox from '@/components/ImageLightbox'

interface Article {
  id: string
  title: string
  slug: string
  content: string
  summary: string
  coverImage: string | null
  coverImagePosition?: string
  isPinned: boolean
  badges: string
  category: {
    name: string
    slug: string
  }
  tags: string
  views: number
  likes: number
  createdAt: string
  updatedAt: string
}

export default function ArticleDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { isAdmin } = useAdminAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/wiki/articles?slug=${slug}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          const a = data.articles[0]
          setArticle(a)
          // 累加瀏覽次數
          fetch('/api/wiki/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityType: 'article', entityId: a.id }),
          })
        }
        setLoading(false)
      })
  }, [slug])

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-sm text-wiki-text-muted mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          {article && (
            <>
              <Link href={`/wiki/guides/${article.category.slug}`} className="hover:text-wiki-accent">
                {article.category.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-wiki-text">{article?.title || '載入中...'}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : !article ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-12 text-center text-wiki-text-muted">
            文章不存在
          </div>
        ) : (
          <article className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg overflow-hidden max-w-4xl mx-auto">
            {article.coverImage && (
              <div className="w-full aspect-[3/1] overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: article.coverImagePosition || '50% 50%' }}
                />
              </div>
            )}
            <div className="p-8">
              <header className="mb-8 pb-6 border-b border-wiki-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {article.isPinned && (
                        <span className="px-2 py-0.5 bg-wiki-danger/20 text-wiki-danger text-xs font-bold border border-wiki-danger/40">
                          置頂
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
                    <div className="flex flex-col gap-1 text-sm text-wiki-text-muted">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span>分類: {article.category.name}</span>
                        <span>{article.views} 瀏覽</span>
                      </div>
                      <span>更新於 {new Date(article.updatedAt).toLocaleDateString('zh-TW')}</span>
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
                    <Link href={`/admin/articles/edit/${article.id}`} className="btn-hard text-wiki-text text-sm flex-shrink-0">
                      編輯文章
                    </Link>
                  )}
                </div>
              </header>

              <div
                ref={contentRef}
                className="prose prose-invert max-w-none [&_img]:cursor-zoom-in"
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (target.tagName !== 'IMG') return
                  const imgs = Array.from(contentRef.current?.querySelectorAll('img') || [])
                    .map(img => img.getAttribute('src') || '')
                    .filter(Boolean)
                  const clickedSrc = (target as HTMLImageElement).src
                  const idx = imgs.findIndex(src => src === clickedSrc || clickedSrc.endsWith(src))
                  setLightboxImages(imgs)
                  setLightboxIndex(idx >= 0 ? idx : 0)
                }}
              >
                <MarkdownRenderer content={article.content} />
              </div>

              {/* 底部留白，給手機底部操作欄讓出空間 */}
              <div className="h-16 lg:h-0" />
            </div>
          </article>
        )}
      </main>

      {article && (
        <ArticleActionBar
          articleId={article.id}
          articleTitle={article.title}
          articleSlug={article.slug}
          initialLikes={article.likes || 0}
        />
      )}

      <WikiFooter />

      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxImages([])}
          onPrev={() => setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length)}
          onNext={() => setLightboxIndex(i => (i + 1) % lightboxImages.length)}
        />
      )}
    </div>
  )
}
