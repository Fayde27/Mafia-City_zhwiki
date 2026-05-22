'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

type Tab = 'list' | 'categories'

interface Article {
  id: string; title: string; slug: string; summary: string
  isPublished: boolean; isFeatured: boolean; isPinned: boolean
  viewCount: number; createdAt: string
  category: { name: string; slug: string; icon: string } | null
}
interface Category {
  id: string; name: string; slug: string; description: string
  icon: string; sortOrder: number
  _count: { articles: number }
}

export default function AdminArticlesPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [loading, setLoading] = useState(true)

  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filterCatSlug, setFilterCatSlug] = useState('all')

  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchAll()
  }, [isAdmin, isLoaded, router])

  const fetchAll = async () => {
    try {
      const [artRes, catRes] = await Promise.all([
        fetch('/api/admin/articles?limit=100').then(r => r.json()),
        fetch('/api/admin/categories').then(r => r.json()),
      ])
      setArticles(artRes?.articles || [])
      setCategories(Array.isArray(catRes) ? catRes : [])
    } finally { setLoading(false) }
  }

  const refetchArticles = () => fetch('/api/admin/articles?limit=100').then(r => r.json()).then(d => setArticles(d?.articles || []))
  const refetchCats = () => fetch('/api/admin/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []))

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這篇文章嗎？')) return
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' }); refetchArticles()
  }
  const handleToggle = async (art: Article, field: 'isPublished' | 'isFeatured' | 'isPinned') => {
    await fetch(`/api/admin/articles/${art.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...art, [field]: !art[field] }) })
    refetchArticles()
  }

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingCat ? `/api/admin/categories/${editingCat.id}` : '/api/admin/categories'
    const res = await fetch(url, { method: editingCat ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) })
    if (res.ok) { refetchCats(); setShowCatModal(false); setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }) }
    else { alert('保存失敗') }
  }
  const handleCatEdit = (cat: Category) => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', sortOrder: cat.sortOrder }); setShowCatModal(true) }
  const handleCatDelete = async (id: string) => {
    if (!confirm('確定要刪除這個分類嗎？')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    const d = await res.json(); if (d.error) alert(d.error); else refetchCats()
  }
  const handleCatMove = async (cat: Category, dir: 'up' | 'down') => {
    const idx = categories.indexOf(cat)
    const target = dir === 'up' ? categories[idx - 1] : categories[idx + 1]
    if (!target) return
    await Promise.all([
      fetch(`/api/admin/categories/${cat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cat, sortOrder: target.sortOrder }) }),
      fetch(`/api/admin/categories/${target.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...target, sortOrder: cat.sortOrder }) }),
    ]); refetchCats()
  }

  if (!isAdmin) return null

  const filtered = filterCatSlug === 'all' ? articles : articles.filter(a => a.category?.slug === filterCatSlug)
  const tabCls = (t: Tab) => `px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === t ? 'border-wiki-accent text-wiki-accent' : 'border-transparent text-wiki-text-muted hover:text-wiki-text'}`

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">攻略文章管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理攻略文章及分類</p>
          </div>
          {activeTab === 'list' && <Link href="/admin/articles/new" className="btn-hard text-wiki-text text-sm">+ 新增文章</Link>}
          {activeTab === 'categories' && <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }); setShowCatModal(true) }} className="btn-hard text-wiki-text text-sm">+ 新增分類</button>}
        </div>

        <div className="border-b border-wiki-border mb-6 flex">
          <button className={tabCls('list')} onClick={() => setActiveTab('list')}>文章列表</button>
          <button className={tabCls('categories')} onClick={() => setActiveTab('categories')}>分類管理</button>
        </div>

        {loading ? <div className="text-center py-12 text-wiki-text-muted">載入中...</div> : (
          <>
            {activeTab === 'list' && (
              <div>
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  <button onClick={() => setFilterCatSlug('all')} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${filterCatSlug === 'all' ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>全部</button>
                  {categories.map(cat => <button key={cat.id} onClick={() => setFilterCatSlug(cat.slug)} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${filterCatSlug === cat.slug ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>{cat.icon} {cat.name}</button>)}
                </div>
                {filtered.length === 0 ? <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">暫無文章</div> : (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-wiki-gray">
                        <tr>{['標題', '分類', '狀態', '熱門', '置頂', '瀏覽', '日期', '操作'].map(h => <th key={h} className="text-left px-4 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filtered.map(art => (
                          <tr key={art.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                            <td className="px-4 py-4">
                              <div className="text-wiki-text font-bold max-w-xs truncate">{art.title}</div>
                              {art.summary && <div className="text-wiki-text-muted text-xs truncate max-w-xs">{art.summary}</div>}
                            </td>
                            <td className="px-4 py-4 text-wiki-text-muted text-sm">{art.category ? `${art.category.icon} ${art.category.name}` : '-'}</td>
                            <td className="px-4 py-4">
                              <button onClick={() => handleToggle(art, 'isPublished')} className={`px-2 py-1 text-xs font-bold ${art.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-wiki-danger/20 text-wiki-danger'}`}>{art.isPublished ? '已發佈' : '草稿'}</button>
                            </td>
                            <td className="px-4 py-4">
                              <button onClick={() => handleToggle(art, 'isFeatured')} className={`px-2 py-1 text-xs font-bold ${art.isFeatured ? 'bg-wiki-accent/20 text-wiki-accent' : 'bg-wiki-gray text-wiki-text-muted'}`}>{art.isFeatured ? '熱門' : '-'}</button>
                            </td>
                            <td className="px-4 py-4">
                              <button onClick={() => handleToggle(art, 'isPinned')} className={`px-2 py-1 text-xs font-bold ${art.isPinned ? 'bg-blue-500/20 text-blue-400' : 'bg-wiki-gray text-wiki-text-muted'}`}>{art.isPinned ? '置頂' : '-'}</button>
                            </td>
                            <td className="px-4 py-4 text-wiki-text-muted text-sm">{art.viewCount}</td>
                            <td className="px-4 py-4 text-wiki-text-muted text-sm">{new Date(art.createdAt).toLocaleDateString('zh-TW')}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <Link href={`/admin/articles/edit/${art.id}`} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">編輯</Link>
                                <button onClick={() => handleDelete(art.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">刪除</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-wiki-gray">
                    <tr>{['圖標', '名稱', '別名', '描述', '文章數', '排序', '操作'].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                        <td className="px-6 py-4 text-2xl">{cat.icon}</td>
                        <td className="px-6 py-4 text-wiki-text font-bold">{cat.name}</td>
                        <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{cat.slug}</td>
                        <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{cat.description}</td>
                        <td className="px-6 py-4 text-wiki-accent font-bold">{cat._count.articles}</td>
                        <td className="px-6 py-4 text-wiki-text-muted">{cat.sortOrder}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 items-center">
                            <button onClick={() => handleCatMove(cat, 'up')} disabled={idx === 0} className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30 disabled:opacity-30">↑</button>
                            <button onClick={() => handleCatMove(cat, 'down')} disabled={idx === categories.length - 1} className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30 disabled:opacity-30">↓</button>
                            <button onClick={() => handleCatEdit(cat)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">編輯</button>
                            <button onClick={() => handleCatDelete(cat.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">刪除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {showCatModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-heading font-bold text-wiki-accent heading-hard mb-6">{editingCat ? '編輯分類' : '新增分類'}</h2>
            <form onSubmit={handleCatSubmit} className="space-y-4">
              {[{ label: '名稱 *', key: 'name', req: true }, { label: '別名 (Slug) *', key: 'slug', req: true }, { label: '圖標 (Emoji)', key: 'icon', req: false }].map(({ label, key, req }) => (
                <div key={key}>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">{label}</label>
                  <input type="text" value={(catForm as any)[key]} onChange={e => setCatForm({ ...catForm, [key]: e.target.value })} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" required={req} />
                </div>
              ))}
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">描述</label>
                <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-20" />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序</label>
                <input type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) })} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-hard text-wiki-text">保存</button>
                <button type="button" onClick={() => setShowCatModal(false)} className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WikiFooter />
    </div>
  )
}
