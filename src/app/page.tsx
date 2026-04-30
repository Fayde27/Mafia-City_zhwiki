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
  const [showAnnounceForm, setShowAnnounceForm] = useState(false)
  const [editingAnnounce, setEditingAnnounce] = useState<Announcement | null>(null)
  const [announceForm, setAnnounceForm] = useState({ title: '', content: '', type: 'info', isActive: true, sortOrder: 0 })

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

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return
    try {
      await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
      setArticles(articles.filter(a => a.id !== id))
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) return
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
      setAnnouncements(announcements.filter(a => a.id !== id))
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleSaveAnnouncement = async () => {
    if (!announceForm.title.trim()) {
      alert('请输入公告标题')
      return
    }
    const url = editingAnnounce
      ? `/api/admin/announcements/${editingAnnounce.id}`
      : '/api/admin/announcements'
    const method = editingAnnounce ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(announceForm),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '保存失败')
        return
      }
      if (editingAnnounce) {
        setAnnouncements(announcements.map(a => a.id === data.id ? data : a))
      } else {
        setAnnouncements([...announcements, data])
      }
      setShowAnnounceForm(false)
      setEditingAnnounce(null)
      setAnnounceForm({ title: '', content: '', type: 'info', isActive: true, sortOrder: 0 })
    } catch (err) {
      alert('保存失败: ' + (err as Error).message)
    }
  }

  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnounce(ann)
    setAnnounceForm({ title: ann.title, content: ann.content, type: ann.type, isActive: ann.isActive, sortOrder: ann.sortOrder })
    setShowAnnounceForm(true)
  }

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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold text-wiki-accent heading-hard mb-3 md:mb-4">
                  黑道風雲 Wiki
                </h1>
                <p className="text-wiki-text text-base md:text-lg mb-4 md:mb-6">
                  最全面的游戏攻略站，提供详细的角色信息、武器装备、任务攻略等内容
                </p>
              </div>
              {isAdmin && (
                <Link href="/admin/dashboard" className="btn-hard text-white text-sm flex-shrink-0">
                  管理后台
                </Link>
              )}
            </div>
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
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-wiki-accent heading-hard">
              分类导航
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category) => (
              <div key={category.id} className="card-hard rounded-lg p-5 md:p-6 relative group">
                <Link href={`/wiki/${category.slug}`} className="block">
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
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/articles/new?category=${category.id}`} className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold hover:bg-wiki-accent/30">
                      新增
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-wiki-accent heading-hard">
              最新更新
            </h2>
            {isAdmin && (
              <Link href="/admin/articles/new" className="btn-hard text-white text-sm">
                + 新增文章
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {articles.map((article) => (
              <div key={article.id} className="card-hard rounded-lg overflow-hidden relative group">
                <Link href={`/wiki/article/${article.slug}`} className="block">
                  {article.coverImage ? (
                    <div className="h-40 md:h-48 bg-wiki-gray overflow-hidden">
                      <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 md:h-48 bg-wiki-gray flex items-center justify-center">
                      <span className="text-wiki-text-muted text-5xl md:text-6xl"></span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-wiki-accent text-xs font-bold uppercase tracking-wider">
                        {article.category.name}
                      </span>
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
                    <h3 className="text-base md:text-lg font-bold text-wiki-text mb-2 line-clamp-1">
                      {article.title}
                    </h3>
                    <p className="text-wiki-text-muted text-sm mb-3 md:mb-4 line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex justify-between items-center text-xs text-wiki-text-muted">
                      <span>{new Date(article.createdAt).toLocaleDateString('zh-TW')}</span>
                      <span> {article.views}</span>
                    </div>
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
        </section>

        <section className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-wiki-danger heading-hard">
              全站公告
            </h2>
            {isAdmin && (
              <button onClick={() => { setShowAnnounceForm(true); setEditingAnnounce(null); setAnnounceForm({ title: '', content: '', type: 'info', isActive: true, sortOrder: 0 }) }} className="btn-hard text-white text-sm">
                + 新增公告
              </button>
            )}
          </div>

          {isAdmin && showAnnounceForm && (
            <div className="card-hard rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">{editingAnnounce ? '编辑公告' : '新增公告'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-wiki-text-muted text-sm mb-1">标题</label>
                  <input
                    type="text"
                    value={announceForm.title}
                    onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                    className="w-full bg-wiki-gray border border-wiki-border px-4 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="请输入公告标题"
                  />
                </div>
                <div>
                  <label className="block text-wiki-text-muted text-sm mb-1">内容</label>
                  <textarea
                    value={announceForm.content}
                    onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                    rows={3}
                    className="w-full bg-wiki-gray border border-wiki-border px-4 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y"
                    placeholder="请输入公告内容"
                  />
                </div>
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-wiki-text-muted text-sm mb-1">类型</label>
                    <select
                      value={announceForm.type}
                      onChange={(e) => setAnnounceForm({ ...announceForm, type: e.target.value })}
                      className="bg-wiki-gray border border-wiki-border px-4 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                    >
                      <option value="info">公告</option>
                      <option value="new">NEW</option>
                      <option value="update">UPDATE</option>
                      <option value="important">重要</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={announceForm.isActive}
                        onChange={(e) => setAnnounceForm({ ...announceForm, isActive: e.target.checked })}
                        className="w-4 h-4 accent-wiki-accent cursor-pointer"
                      />
                      启用
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleSaveAnnouncement} className="btn-hard text-white text-sm">保存</button>
                  <button type="button" onClick={() => { setShowAnnounceForm(false); setEditingAnnounce(null) }} className="px-6 py-3 bg-wiki-gray text-wiki-text-muted font-bold hover:text-wiki-text text-sm cursor-pointer">取消</button>
                </div>
              </div>
            </div>
          )}

          <div className="card-hard rounded-lg p-5 md:p-6 bg-gradient-to-r from-wiki-danger/20 to-wiki-dark">
            {announcements.length === 0 ? (
              <p className="text-wiki-text-muted text-sm">暂无公告</p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="flex items-start gap-3 group relative">
                    <span className="text-wiki-accent font-bold text-sm">[{getTypeLabel(ann.type)}]</span>
                    <div className="flex-1">
                      <p className="text-wiki-text text-sm md:text-base font-bold">{ann.title}</p>
                      <p className="text-wiki-text-muted text-xs md:text-sm">{ann.content}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => handleEditAnnouncement(ann)} className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold hover:bg-wiki-accent/30">
                          编辑
                        </button>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="px-2 py-1 bg-wiki-danger/20 text-wiki-danger text-xs font-bold hover:bg-wiki-danger/30">
                          删除
                        </button>
                      </div>
                    )}
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
