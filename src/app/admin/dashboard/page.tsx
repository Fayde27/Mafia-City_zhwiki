'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  isPublished: boolean
  category: {
    name: string
  }
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

export default function AdminDashboardPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'articles' | 'categories' | 'announcements'>('articles')
  const [showAnnounceForm, setShowAnnounceForm] = useState(false)
  const [editingAnnounce, setEditingAnnounce] = useState<Announcement | null>(null)
  const [announceForm, setAnnounceForm] = useState({ title: '', content: '', type: 'info', isActive: true, sortOrder: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/articles?limit=20').then(res => res.json()),
      fetch('/api/admin/announcements').then(res => res.json()),
    ]).then(([arts, anns]) => {
      setArticles(arts.articles)
      setAnnouncements(anns)
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
    const token = localStorage.getItem('token')
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
      if (editingAnnounce) {
        setAnnouncements(announcements.map(a => a.id === data.id ? data : a))
      } else {
        setAnnouncements([...announcements, data])
      }
      setShowAnnounceForm(false)
      setEditingAnnounce(null)
      setAnnounceForm({ title: '', content: '', type: 'info', isActive: true, sortOrder: 0 })
    } catch (err) {
      alert('保存失败')
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
      <header className="bg-wiki-darker border-b-2 border-wiki-accent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-wiki-text-muted hover:text-wiki-accent">
                返回玩家端
              </Link>
              <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
                管理后台
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {activeTab === 'articles' && (
                <Link href="/admin/articles/new" className="btn-hard text-white text-sm">
                  + 新增文章
                </Link>
              )}
              {activeTab === 'announcements' && (
                <button onClick={() => { setShowAnnounceForm(true); setEditingAnnounce(null); setAnnounceForm({ title: '', content: '', type: 'info', isActive: true, sortOrder: 0 }) }} className="btn-hard text-white text-sm">
                  + 新增公告
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-3 font-bold uppercase tracking-wider ${
              activeTab === 'articles'
                ? 'bg-wiki-accent text-white'
                : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
            }`}
          >
            文章管理
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 font-bold uppercase tracking-wider ${
              activeTab === 'categories'
                ? 'bg-wiki-accent text-white'
                : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
            }`}
          >
            分类管理
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-6 py-3 font-bold uppercase tracking-wider ${
              activeTab === 'announcements'
                ? 'bg-wiki-accent text-white'
                : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
            }`}
          >
            公告管理
          </button>
        </div>

        {activeTab === 'articles' && (
          <div className="card-hard rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-wiki-gray">
                <tr>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">标题</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">分类</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">状态</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">浏览量</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">创建时间</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-wiki-text-muted">加载中...</td></tr>
                ) : articles.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-wiki-text-muted">暂无文章</td></tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                      <td className="px-6 py-4">
                        <div className="text-wiki-text font-bold">{article.title}</div>
                        <div className="text-wiki-text-muted text-xs">{article.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-wiki-text-muted">{article.category.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold uppercase ${article.isPublished ? 'bg-wiki-success/20 text-wiki-success' : 'bg-wiki-danger/20 text-wiki-danger'}`}>
                          {article.isPublished ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-wiki-text-muted">{article.views}</td>
                      <td className="px-6 py-4 text-wiki-text-muted text-sm">{new Date(article.createdAt).toLocaleDateString('zh-TW')}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/articles/edit/${article.id}`} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">编辑</Link>
                          <button onClick={() => handleDeleteArticle(article.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="card-hard rounded-lg p-8 text-center">
            <p className="text-wiki-text-muted mb-4">分类管理已移至独立页面</p>
            <Link href="/admin/categories" className="btn-hard text-white inline-block">进入分类管理</Link>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            {showAnnounceForm && (
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
                    />
                  </div>
                  <div>
                    <label className="block text-wiki-text-muted text-sm mb-1">内容</label>
                    <textarea
                      value={announceForm.content}
                      onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                      rows={3}
                      className="w-full bg-wiki-gray border border-wiki-border px-4 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-wiki-text-muted text-sm mb-1">类型</label>
                      <select
                        value={announceForm.type}
                        onChange={(e) => setAnnounceForm({ ...announceForm, type: e.target.value })}
                        className="bg-wiki-gray border border-wiki-border px-4 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      >
                        <option value="info">公告</option>
                        <option value="new">NEW</option>
                        <option value="update">UPDATE</option>
                        <option value="important">重要</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-wiki-text cursor-pointer">
                        <input
                          type="checkbox"
                          checked={announceForm.isActive}
                          onChange={(e) => setAnnounceForm({ ...announceForm, isActive: e.target.checked })}
                          className="w-4 h-4 accent-wiki-accent"
                        />
                        启用
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveAnnouncement} className="btn-hard text-white text-sm">保存</button>
                    <button onClick={() => { setShowAnnounceForm(false); setEditingAnnounce(null) }} className="px-6 py-3 bg-wiki-gray text-wiki-text-muted font-bold hover:text-wiki-text text-sm">取消</button>
                  </div>
                </div>
              </div>
            )}
            <div className="card-hard rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-wiki-gray">
                  <tr>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">标题</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">类型</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">状态</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">排序</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-wiki-text-muted">暂无公告</td></tr>
                  ) : (
                    announcements.map((ann) => (
                      <tr key={ann.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                        <td className="px-6 py-4">
                          <div className="text-wiki-text font-bold">{ann.title}</div>
                          <div className="text-wiki-text-muted text-xs line-clamp-1">{ann.content}</div>
                        </td>
                        <td className="px-6 py-4"><span className="text-wiki-accent text-sm">[{getTypeLabel(ann.type)}]</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-bold uppercase ${ann.isActive ? 'bg-wiki-success/20 text-wiki-success' : 'bg-wiki-danger/20 text-wiki-danger'}`}>
                            {ann.isActive ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-wiki-text-muted">{ann.sortOrder}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditAnnouncement(ann)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">编辑</button>
                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">删除</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
