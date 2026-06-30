'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

type Tab = 'list' | 'categories'

interface EntityEvent {
  id: string; name: string; slug: string
  isPublished: boolean; sortOrder: number
  icon?: string; summary?: string
  category?: { name: string; slug: string }
  EventCategory?: { name: string; slug: string }
}
interface EntityCategory {
  id: string; name: string; slug: string; description: string
  icon: string; sortOrder: number
  _count: { events: number }
}

export default function AdminEventsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EntityEvent[]>([])
  const [filterCatSlug, setFilterCatSlug] = useState('all')
  const [categories, setCategories] = useState<EntityCategory[]>([])
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<EntityCategory | null>(null)
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchAll()
  }, [isAdmin, isLoaded, router])

  const fetchAll = async () => {
    try {
      const [eventRes, catRes] = await Promise.all([
        fetch('/api/admin/events').then(r => r.json()),
        fetch('/api/admin/event-categories').then(r => r.json()),
      ])
      const raw = eventRes?.events || eventRes
      setEvents(Array.isArray(raw) ? raw : [])
      setCategories(Array.isArray(catRes) ? catRes : [])
    } finally { setLoading(false) }
  }

  const refetchEvents = async () => {
    const d = await fetch('/api/admin/events').then(r => r.json())
    const raw = d?.events || d; setEvents(Array.isArray(raw) ? raw : [])
  }
  const refetchCats = () => fetch('/api/admin/event-categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []))

  const handleTogglePublish = async (ev: EntityEvent) => {
    await fetch(`/api/admin/events/${ev.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...ev, isPublished: !ev.isPublished }) })
    refetchEvents()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除嗎？')) return
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' }); refetchEvents()
  }

  const handleCatSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const url = editingCat ? `/api/admin/event-categories/${editingCat.id}` : '/api/admin/event-categories'
    const res = await fetch(url, { method: editingCat ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) })
    if (res.ok) { refetchCats(); setShowCatModal(false); setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }) }
    else { const d = await res.json(); alert(d.error || '保存失敗') }
  }
  const handleCatEdit = (cat: EntityCategory) => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', sortOrder: cat.sortOrder }); setShowCatModal(true) }
  const handleCatDelete = async (id: string) => {
    if (!confirm('確定要刪除這個分類嗎？')) return
    await fetch(`/api/admin/event-categories/${id}`, { method: 'DELETE' }); refetchCats()
  }
  const handleCatMove = async (cat: EntityCategory, dir: 'up' | 'down') => {
    const idx = categories.indexOf(cat)
    const target = dir === 'up' ? categories[idx - 1] : categories[idx + 1]
    if (!target) return
    await Promise.all([
      fetch(`/api/admin/event-categories/${cat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cat, sortOrder: target.sortOrder }) }),
      fetch(`/api/admin/event-categories/${target.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...target, sortOrder: cat.sortOrder }) }),
    ]); refetchCats()
  }

  if (!isAdmin) return null

  const filtered = filterCatSlug === 'all' ? events : events.filter(it => (it.category?.slug || it.EventCategory?.slug) === filterCatSlug)
  const tabCls = (t: Tab) => `px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === t ? 'border-wiki-accent text-wiki-accent' : 'border-transparent text-wiki-text-muted hover:text-wiki-text'}`

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">活動一覽管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理活動列表及分類</p>
          </div>
          {activeTab === 'list' && <Link href="/admin/events/new" className="btn-hard text-wiki-text text-sm">+ 新增活動</Link>}
          {activeTab === 'categories' && <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }); setShowCatModal(true) }} className="btn-hard text-wiki-text text-sm">+ 新增分類</button>}
        </div>

        <div className="border-b border-wiki-border mb-6 flex">
          <button className={tabCls('list')} onClick={() => setActiveTab('list')}>活動列表</button>
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
                {filtered.length === 0 ? <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">暫無活動數據</div> : (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-wiki-gray">
                        <tr>{["活動","簡介","分類","狀態","操作"].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filtered.map(it => (
                          <tr key={it.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {it.icon ? <img src={it.icon} alt={it.name} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-wiki-gray flex items-center justify-center text-wiki-text-muted">{it.name[0]}</div>}
                                <div className="text-wiki-text font-bold">{it.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{it.summary || '-'}</td>
                            <td className="px-6 py-4 text-wiki-text-muted text-sm">{it.category?.name || it.EventCategory?.name || '-'}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleTogglePublish(it)} className={`px-2 py-1 text-xs font-bold ${it.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-wiki-danger/20 text-wiki-danger'}`}>{it.isPublished ? '已發佈' : '草稿'}</button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Link href={`/admin/events/edit/${it.id}`} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">編輯</Link>
                                <button onClick={() => handleDelete(it.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">刪除</button>
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
                    <tr>{['圖標', '名稱', '別名', '描述', '活動數', '排序', '操作'].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                        <td className="px-6 py-4 text-2xl">{cat.icon}</td>
                        <td className="px-6 py-4 text-wiki-text font-bold">{cat.name}</td>
                        <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{cat.slug}</td>
                        <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{cat.description}</td>
                        <td className="px-6 py-4 text-wiki-accent font-bold">{cat._count.events}</td>
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
                  <input type="text" value={(catForm as any)[key]} onChange={ev => setCatForm({ ...catForm, [key]: ev.target.value })} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" required={req} />
                </div>
              ))}
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">描述</label>
                <textarea value={catForm.description} onChange={ev => setCatForm({ ...catForm, description: ev.target.value })} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-20" />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序</label>
                <input type="number" value={catForm.sortOrder} onChange={ev => setCatForm({ ...catForm, sortOrder: parseInt(ev.target.value) })} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" />
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
