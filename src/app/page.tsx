'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

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
  isPublished: boolean
  isPinned: boolean
  badges: string
  views: number
  createdAt: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export default function HomePage() {
  const { isAdmin, token } = useAdminAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/wiki/categories').then(res => res.json()),
      fetch('/api/wiki/articles?limit=6').then(res => res.json()),
      fetch('/api/wiki/announcements').then(res => res.json()),
    ]).then(([cats, arts, anns]) => {
      setCategories(cats || [])
      setArticles(arts?.articles || [])
      setAnnouncements(anns || [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/wiki/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return
    try {
      await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
      setArticles(articles.filter(a => a.id !== id))
    } catch (err) {
      alert('删除失败')
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new': return 'NEW'
      case 'update': return 'UPDATE'
      case 'important': return '重要'
      default: return '公告'
    }
  }

  const quickLinks = [
    { label: '新手入门', href: '/wiki/guides', icon: '📖' },
    { label: '角色图鉴', href: '/wiki/characters/characters', icon: '👤' },
    { label: '建筑图鉴', href: '/wiki/buildings', icon: '🏠' },
    { label: '装备图鉴', href: '/wiki/equipment', icon: '⚔️' },
    { label: '道具图鉴', href: '/wiki/items', icon: '' },
    { label: '兵种图鉴', href: '/wiki/troops', icon: '️' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <section className="mb-8">
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-8">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlOGM1NDciIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDR2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[#e8c547] text-sm font-bold uppercase tracking-wider">玩法攻略</span>
                    <span className="text-gray-500 text-xs">从入门到精通，带你征战天下</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    黑道風雲 <span className="text-[#e8c547]">Wiki</span>
                  </h1>
                  <form onSubmit={handleSearch} className="max-w-xl mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索攻略、角色、装备..."
                        className="w-full bg-white border border-gray-300 px-5 py-3 text-gray-900 placeholder-gray-400 focus:border-[#e8c547] focus:outline-none rounded-lg"
                      />
                      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#e8c547]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {['新手入门', '角色攻略', '装备图鉴', '建筑攻略', '阵容搭配', '赛事活动'].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 hover:border-[#e8c547] hover:text-[#e8c547] cursor-pointer transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  <span className="text-[#e8c547] mr-2">◆</span>
                  玩法指南
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '', title: '新手入门', desc: '从零开始', href: '/wiki/guides' },
                  { icon: '🎯', title: '核心玩法', desc: '游戏机制', href: '/wiki' },
                  { icon: '️', title: '进阶技巧', desc: '高手攻略', href: '/wiki/characters/characters' },
                  { icon: '🏆', title: '赛事活动', desc: '最新活动', href: '/wiki' },
                ].map((item) => (
                  <Link key={item.title} href={item.href} className="group">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#e8c547]/50 transition-all duration-300">
                      <div className="text-3xl mb-3">{item.icon}</div>
                      <h3 className="text-gray-900 font-bold text-sm mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-xs mb-3">{item.desc}</p>
                      <span className="text-[#e8c547] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        查看详情 →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  <span className="text-[#e8c547] mr-2">◆</span>
                  热门攻略
                </h2>
                {isAdmin && (
                  <Link href="/admin/articles/new" className="text-[#e8c547] text-xs hover:underline">
                    + 新增文章
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {articles.map((article, index) => (
                  <Link key={article.id} href={`/wiki/article/${article.slug}`} className="block group">
                    <div className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-[#e8c547]/30 transition-all duration-300 relative">
                      {article.coverImage ? (
                        <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-2xl">{article.category.name?.charAt(0) || '📄'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#e8c547] text-xs font-bold">{article.category.name}</span>
                          {article.isPinned && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded">置顶</span>
                          )}
                          {article.badges && article.badges.split(',').filter(Boolean).map((badge) => {
                            const badgeStyle = badge === 'HOT' ? 'bg-red-50 text-red-500'
                              : badge === 'NEW' ? 'bg-[#e8c547]/10 text-[#e8c547]'
                              : 'bg-blue-50 text-blue-500'
                            return (
                              <span key={badge} className={`px-2 py-0.5 text-xs rounded ${badgeStyle}`}>
                                {badge}
                              </span>
                            )
                          })}
                        </div>
                        <h3 className="text-gray-900 font-bold text-sm md:text-base mb-1 line-clamp-1 group-hover:text-[#e8c547] transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 text-xs md:text-sm line-clamp-2 mb-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{new Date(article.createdAt).toLocaleDateString('zh-TW')}</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {article.views}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/articles/edit/${article.id}`} className="px-2 py-1 bg-[#e8c547]/10 text-[#e8c547] text-xs rounded hover:bg-[#e8c547]/30">
                            编辑
                          </Link>
                          <button onClick={(e) => { e.preventDefault(); handleDeleteArticle(article.id) }} className="px-2 py-1 bg-red-50 text-red-500 text-xs rounded hover:bg-red-500/30">
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  <span className="text-red-500 mr-2">◆</span>
                  全站公告
                </h2>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无公告</p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                        <span className="text-[#e8c547] text-xs font-bold flex-shrink-0 mt-0.5">[{getTypeLabel(ann.type)}]</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-bold">{ann.title}</p>
                          <p className="text-gray-500 text-xs mt-1">{ann.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-gray-900 font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="text-[#e8c547]">◆</span>
                  新手快速入口
                </h3>
                <div className="space-y-2">
                  {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 transition-colors group">
                      <span className="text-lg">{link.icon}</span>
                      <span className="text-gray-700 text-sm group-hover:text-[#e8c547] transition-colors">{link.label}</span>
                      <svg className="w-4 h-4 text-gray-600 ml-auto group-hover:text-[#e8c547] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-gray-900 font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="text-[#e8c547]">◆</span>
                  快捷功能
                </h3>
                <div className="space-y-2">
                  {[
                    { label: '新手入门', icon: '📖' },
                    { label: '新手必看', icon: '⭐' },
                    { label: '新手攻略', icon: '📋' },
                    { label: '新手问答', icon: '❓' },
                    { label: '常见问题', icon: '💡' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-gray-700 text-sm group-hover:text-[#e8c547] transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-gray-900 font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="text-[#e8c547]">◆</span>
                  热门分类
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['新手攻略', '角色攻略', '装备图鉴', '建筑攻略', '阵容搭配', '赛事活动', '更新日志', '常见问题'].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-100/60 text-gray-500 text-xs rounded-full border border-gray-200 hover:border-[#e8c547] hover:text-[#e8c547] cursor-pointer transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-gray-900 font-bold text-sm mb-4 flex items-center gap-2">
                    <span className="text-[#e8c547]">◆</span>
                    管理入口
                  </h3>
                  <div className="space-y-2">
                    <Link href="/admin/dashboard" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 transition-colors group">
                      <span className="text-lg">️</span>
                      <span className="text-gray-700 text-sm group-hover:text-[#e8c547] transition-colors">管理后台</span>
                    </Link>
                    <Link href="/admin/categories" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 transition-colors group">
                      <span className="text-lg">📁</span>
                      <span className="text-gray-700 text-sm group-hover:text-[#e8c547] transition-colors">分类管理</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <WikiFooter />
    </div>
  )
}
