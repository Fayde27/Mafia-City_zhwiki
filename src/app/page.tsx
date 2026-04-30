'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  _count: {
    articles: number
  }
}

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
  views: number
  createdAt: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  createdAt: string
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/wiki/categories').then(res => res.json()),
      fetch('/api/wiki/articles?limit=6').then(res => res.json()),
      fetch('/api/wiki/announcements').then(res => res.json()),
    ]).then(([cats, arts, anns]) => {
      setCategories(cats)
      setArticles(arts.articles)
      setAnnouncements(anns)
      setLoading(false)
    })
  }, [])

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new': return 'NEW'
      case 'update': return 'UPDATE'
      case 'important': return '重要'
      default: return '公告'
    }
  }

  return (
    <div className="min-h-screen bg-wiki-dark">
      <WikiHeader />
      
      <main className="container mx-auto px-4 py-6 md:py-8">
        <section className="mb-8 md:mb-12">
          <div className="card-hard rounded-lg p-6 md:p-8 bg-gradient-to-r from-wiki-gray via-wiki-dark to-wiki-gray">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-wiki-accent heading-hard mb-3 md:mb-4">
              黑道風雲 Wiki
            </h1>
            <p className="text-wiki-text text-base md:text-lg mb-4 md:mb-6">
              最全面的游戏攻略站，提供详细的角色信息、武器装备、任务攻略等内容
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Link href="/wiki/guides" className="btn-hard text-white text-sm md:text-base">
                新手入门
              </Link>
              <Link href="/wiki/characters" className="btn-hard text-white text-sm md:text-base">
                角色图鉴
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-wiki-accent heading-hard mb-4 md:mb-6">
            分类导航
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/wiki/${category.slug}`}
                className="card-hard rounded-lg p-5 md:p-6 block transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">{category.icon}</div>
                <h3 className="text-lg md:text-xl font-bold text-wiki-text mb-2 uppercase tracking-wider">
                  {category.name}
                </h3>
                <p className="text-wiki-text-muted text-sm mb-3 md:mb-4 line-clamp-2">
                  {category.description}
                </p>
                <div className="text-wiki-accent text-sm font-bold">
                  {category._count.articles} 篇文章
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-wiki-accent heading-hard mb-4 md:mb-6">
            最新更新
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/article/${article.slug}`}
                className="card-hard rounded-lg overflow-hidden block transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                {article.coverImage ? (
                  <div className="h-40 md:h-48 bg-wiki-gray overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 md:h-48 bg-wiki-gray flex items-center justify-center">
                    <span className="text-wiki-text-muted text-5xl md:text-6xl">📄</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="text-wiki-accent text-xs font-bold uppercase tracking-wider mb-2">
                    {article.category.name}
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-wiki-text mb-2 line-clamp-1">
                    {article.title}
                  </h3>
                  <p className="text-wiki-text-muted text-sm mb-3 md:mb-4 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex justify-between items-center text-xs text-wiki-text-muted">
                    <span>{new Date(article.createdAt).toLocaleDateString('zh-TW')}</span>
                    <span>👁 {article.views}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8 md:mb-12">
          <div className="card-hard rounded-lg p-5 md:p-6 bg-gradient-to-r from-wiki-danger/20 to-wiki-dark">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-wiki-danger heading-hard mb-3 md:mb-4">
              📢 全站公告
            </h2>
            {announcements.length === 0 ? (
              <p className="text-wiki-text-muted text-sm">暂无公告</p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="flex items-start gap-3">
                    <span className="text-wiki-accent font-bold text-sm">[{getTypeLabel(ann.type)}]</span>
                    <div>
                      <p className="text-wiki-text text-sm md:text-base font-bold">{ann.title}</p>
                      <p className="text-wiki-text-muted text-xs md:text-sm">{ann.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <WikiFooter />
    </div>
  )
}
