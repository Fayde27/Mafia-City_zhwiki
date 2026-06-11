'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

type Tab = 'list' | 'categories' | 'filters'

interface EntityItem {
  id: string; name: string; slug: string; rarity: number
  isPublished: boolean; sortOrder: number
  icon?: string; type?: string; func?: string
  category?: { name: string; slug: string }
  BuildingCategory?: { name: string; slug: string }
}
interface EntityCategory {
  id: string; name: string; slug: string; description: string
  icon: string; sortOrder: number
  _count: { buildings: number }
}
interface FilterOption { id: string; type: string; value: string; sortOrder: number; categoryId: string }

export default function AdminBuildingsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<EntityItem[]>([])
  const [filterCatSlug, setFilterCatSlug] = useState('all')
  const [categories, setCategories] = useState<EntityCategory[]>([])
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<EntityCategory | null>(null)
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([])
  const [selectedCatId, setSelectedCatId] = useState('')
  const [newType, setNewType] = useState('')
  const [newValue, setNewValue] = useState('')
  const [filterSaving, setFilterSaving] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchAll()
  }, [isAdmin, isLoaded, router])

  const fetchAll = async () => {
    try {
      const [itemRes, catRes, filterRes] = await Promise.all([
        fetch('/api/admin/buildings').then(r => r.json()),
        fetch('/api/admin/building-categories').then(r => r.json()),
        fetch('/api/admin/building-filters').then(r => r.json()),
      ])
      const raw = itemRes?.buildings || itemRes
      setItems(Array.isArray(raw) ? raw : [])
      const cats = Array.isArray(catRes) ? catRes : []
      setCategories(cats)
      if (cats.length > 0) setSelectedCatId(cats[0].id)
      setFilterOptions(Array.isArray(filterRes) ? filterRes : [])
    } finally { setLoading(false) }
  }

  const refetchItems = async () => {
    const d = await fetch('/api/admin/buildings').then(r => r.json())
    const raw = d?.buildings || d; setItems(Array.isArray(raw) ? raw : [])
  }
  const refetchCats = () => fetch('/api/admin/building-categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []))
  const refetchFilters = () => fetch('/api/admin/building-filters').then(r => r.json()).then(d => setFilterOptions(Array.isArray(d) ? d : []))

  const handleTogglePublish = async (item: EntityItem) => {
    await fetch(`/api/admin/buildings/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, isPublished: !item.isPublished }) })
    refetchItems()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除嗎？')) return
    await fetch(`/api/admin/buildings/${id}`, { method: 'DELETE' }); refetchItems()
  }

  const handleCatSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const url = editingCat ? `/api/admin/building-categories/${editingCat.id}` : '/api/admin/building-categories'
    const res = await fetch(url, { method: editingCat ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) })
    if (res.ok) { refetchCats(); setShowCatModal(false); setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }) }
    else { const d = await res.json(); alert(d.error || '保存失敗') }
  }
  const handleCatEdit = (cat: EntityCategory) => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', sortOrder: cat.sortOrder }); setShowCatModal(true) }
  const handleCatDelete = async (id: string) => {
    if (!confirm('確定要刪除這個分類嗎？')) return
    await fetch(`/api/admin/building-categories/${id}`, { method: 'DELETE' }); refetchCats()
  }
  const handleCatMove = async (cat: EntityCategory, dir: 'up' | 'down') => {
    const idx = categories.indexOf(cat)
    const target = dir === 'up' ? categories[idx - 1] : categories[idx + 1]
    if (!target) return
    await Promise.all([
      fetch(`/api/admin/building-categories/${cat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cat, sortOrder: target.sortOrder }) }),
      fetch(`/api/admin/building-categories/${target.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...target, sortOrder: cat.sortOrder }) }),
    ]); refetchCats()
  }

  const handleFilterAdd = async () => {
    if (!newValue.trim() || !newType.trim() || !selectedCatId) return
    setFilterSaving(true)
    try {
      const res = await fetch('/api/admin/building-filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: newType.trim(), value: newValue.trim(), categoryId: selectedCatId }) })
      if (res.ok) { setNewValue(''); refetchFilters() }
    } finally { setFilterSaving(false) }
  }
  const handleFilterDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/admin/building-filters/${id}`, { method: 'DELETE' }); refetchFilters()
  }
  const handleFilterSort = async (id: string, sortOrder: number) => {
    await fetch(`/api/admin/building-filters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder }) }); refetchFilters()
  }

  if (!isAdmin) return null

  const filtered = filterCatSlug === 'all' ? items : items.filter(bld => (bld.category?.slug || bld.BuildingCategory?.slug) === filterCatSlug)
  const currentOptions = filterOptions.filter(o => o.categoryId === selectedCatId)
  const existingTypes = Array.from(new Set(currentOptions.map(o => o.type))).sort()
  const groupedOptions = existingTypes.reduce((acc, type) => { acc[type] = currentOptions.filter(o => o.type === type).sort((a, b) => a.sortOrder - b.sortOrder); return acc }, {} as Record<string, FilterOption[]>)
  const allTypes = Array.from(new Set(filterOptions.map(o => o.type))).sort()
  const getRarityStars = (r: number) => '★'.repeat(r) + '☆'.repeat(5 - r)
  const tabCls = (t: Tab) => `px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === t ? 'border-wiki-accent text-wiki-accent' : 'border-transparent text-wiki-text-muted hover:text-wiki-text'}`

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">建築圖鑑管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理建築列表、分類及篩選設定</p>
          </div>
          {activeTab === 'list' && <Link href="/admin/buildings/new" className="btn-hard text-wiki-text text-sm">+ 新增建築</Link>}
          {activeTab === 'categories' && <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }); setShowCatModal(true) }} className="btn-hard text-wiki-text text-sm">+ 新增分類</button>}
        </div>

        <div className="border-b border-wiki-border mb-6 flex">
          <button className={tabCls('list')} onClick={() => setActiveTab('list')}>建築列表</button>
          <button className={tabCls('categories')} onClick={() => setActiveTab('categories')}>分類管理</button>
          <button className={tabCls('filters')} onClick={() => setActiveTab('filters')}>篩選設定</button>
        </div>

        {loading ? <div className="text-center py-12 text-wiki-text-muted">載入中...</div> : (
          <>
            {activeTab === 'list' && (
              <div>
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  <button onClick={() => setFilterCatSlug('all')} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${filterCatSlug === 'all' ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>全部</button>
                  {categories.map(cat => <button key={cat.id} onClick={() => setFilterCatSlug(cat.slug)} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${filterCatSlug === cat.slug ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>{cat.icon} {cat.name}</button>)}
                </div>
                {filtered.length === 0 ? <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">暫無建築數據</div> : (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-wiki-gray">
                        <tr>{["建築","類型","功能","分類","狀態","操作"].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filtered.map(bld => (
                          <tr key={bld.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {bld.icon ? <img src={bld.icon} alt={bld.name} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-wiki-gray flex items-center justify-center text-wiki-text-muted">{bld.name[0]}</div>}
                                <div className="text-wiki-text font-bold">{bld.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-yellow-400 text-sm">{getRarityStars(bld.rarity)}</td>
                            <td className="px-6 py-4 text-wiki-text text-sm">{bld.type || '-'}</td>
                            <td className="px-6 py-4 text-wiki-text text-sm">{(bld as any).function || '-'}</td>
                            <td className="px-6 py-4 text-wiki-text-muted text-sm">{bld.category?.name || bld.BuildingCategory?.name || '-'}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleTogglePublish(bld)} className={`px-2 py-1 text-xs font-bold ${bld.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-wiki-danger/20 text-wiki-danger'}`}>{bld.isPublished ? '已發佈' : '草稿'}</button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Link href={`/admin/buildings/edit/${bld.id}`} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">編輯</Link>
                                <button onClick={() => handleDelete(bld.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">刪除</button>
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
                    <tr>{['圖標', '名稱', '別名', '描述', '建築數', '排序', '操作'].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                        <td className="px-6 py-4 text-2xl">{cat.icon}</td>
                        <td className="px-6 py-4 text-wiki-text font-bold">{cat.name}</td>
                        <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{cat.slug}</td>
                        <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{cat.description}</td>
                        <td className="px-6 py-4 text-wiki-accent font-bold">{cat._count.buildings}</td>
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

            {activeTab === 'filters' && (
              <div>
                <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 mb-6 flex items-center gap-4">
                  <span className="text-wiki-text font-bold text-sm flex-shrink-0">當前分類：</span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => <button key={cat.id} onClick={() => setSelectedCatId(cat.id)} className={`px-4 py-1.5 text-sm font-bold transition-colors ${selectedCatId === cat.id ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>{cat.name}</button>)}
                  </div>
                </div>
                <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-wiki-accent mb-4">添加篩選選項（到「{categories.find(c => c.id === selectedCatId)?.name ?? '...'}」）</h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-shrink-0">
                      <label className="block text-wiki-text-muted text-xs mb-1">篩選大類</label>
                      <input type="text" value={newType} onChange={ev => setNewType(ev.target.value)} list="types-buildings" className="w-40 bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none" placeholder="如：稀有度" />
                      <datalist id="types-buildings">{allTypes.map(t => <option key={t} value={t} />)}</datalist>
                    </div>
                    <div className="flex-1">
                      <label className="block text-wiki-text-muted text-xs mb-1">選項值</label>
                      <input type="text" value={newValue} onChange={ev => setNewValue(ev.target.value)} onKeyDown={ev => ev.key === 'Enter' && handleFilterAdd()} className="w-full bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none" placeholder="如：★★★★★" />
                    </div>
                    <button onClick={handleFilterAdd} disabled={filterSaving || !newValue.trim() || !newType.trim() || !selectedCatId} className="btn-hard text-wiki-text disabled:opacity-50 px-6 py-2">添加</button>
                  </div>
                </div>
                {existingTypes.length === 0 ? (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">該分類暫無篩選選項</div>
                ) : (
                  <div className="space-y-4">
                    {existingTypes.map(type => (
                      <div key={type} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
                        <h3 className="text-lg font-bold text-wiki-accent mb-4">{type}</h3>
                        <div className="space-y-2">
                          {groupedOptions[type].map(opt => (
                            <div key={opt.id} className="flex items-center gap-4 bg-wiki-gray rounded-lg p-3">
                              <input type="number" value={opt.sortOrder} onChange={ev => handleFilterSort(opt.id, parseInt(ev.target.value) || 0)} className="w-16 bg-wiki-carder border border-wiki-border px-2 py-1 text-wiki-text text-center" />
                              <span className="text-wiki-text flex-1">{opt.value}</span>
                              <button onClick={() => handleFilterDelete(opt.id)} className="text-wiki-danger text-sm hover:opacity-70">刪除</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
