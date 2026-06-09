'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

type Tab = 'list' | 'categories' | 'filters'

interface Character {
  id: string; name: string; slug: string; title: string; avatar: string
  rarity: string; role: string; weapon: string; isPublished: boolean; sortOrder: number
  awakenHero: boolean; characterType: string
  CharacterCategory: { name: string; slug: string } | null
}
interface CharacterCategory {
  id: string; name: string; slug: string; description: string; icon: string; sortOrder: number
  _count: { characters: number }
}
interface FilterOption { id: string; type: string; value: string; sortOrder: number; categoryId: string }

export default function AdminCharactersPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [loading, setLoading] = useState(true)

  // 列表
  const [characters, setCharacters] = useState<Character[]>([])
  const [filterCatSlug, setFilterCatSlug] = useState('all')

  // 分類
  const [categories, setCategories] = useState<CharacterCategory[]>([])
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<CharacterCategory | null>(null)
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })

  // 篩選
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
      const [charRes, catRes, filterRes] = await Promise.all([
        fetch('/api/admin/characters?limit=200').then(r => r.json()),
        fetch('/api/admin/character-categories').then(r => r.json()),
        fetch('/api/admin/character-filters').then(r => r.json()),
      ])
      setCharacters(charRes?.characters || [])
      const cats = Array.isArray(catRes) ? catRes : []
      setCategories(cats)
      if (cats.length > 0) setSelectedCatId(cats[0].id)
      setFilterOptions(Array.isArray(filterRes) ? filterRes : [])
    } finally { setLoading(false) }
  }

  const refetchChars = () => fetch('/api/admin/characters?limit=200').then(r => r.json()).then(d => setCharacters(d?.characters || []))
  const refetchCats = () => fetch('/api/admin/character-categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []))
  const refetchFilters = () => fetch('/api/admin/character-filters').then(r => r.json()).then(d => setFilterOptions(Array.isArray(d) ? d : []))

  const handleTogglePublish = async (c: Character) => {
    const api = c.characterType === 'haojie' ? `/api/admin/haojie/${c.id}` : `/api/admin/characters/${c.id}`
    await fetch(api, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...c, isPublished: !c.isPublished }) })
    refetchChars()
  }
  const handleDelete = async (c: Character) => {
    if (!confirm(`確定要刪除「${c.name}」嗎？`)) return
    const api = c.characterType === 'haojie' ? `/api/admin/haojie/${c.id}` : `/api/admin/characters/${c.id}`
    await fetch(api, { method: 'DELETE' })
    refetchChars()
  }

  const editLink = (c: Character) => {
    const catName = c.CharacterCategory?.name ?? ''
    const isHaojie = c.characterType === 'haojie' || catName.includes('豪')
    return isHaojie
      ? `/admin/characters/haojie/edit/${c.id}`
      : `/admin/characters/edit/${c.id}`
  }

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingCat ? `/api/admin/character-categories/${editingCat.id}` : '/api/admin/character-categories'
    const res = await fetch(url, { method: editingCat ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) })
    if (res.ok) { refetchCats(); setShowCatModal(false); setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }) }
    else { const d = await res.json(); alert(d.error || '保存失敗') }
  }
  const handleCatEdit = (cat: CharacterCategory) => {
    setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', sortOrder: cat.sortOrder }); setShowCatModal(true)
  }
  const handleCatDelete = async (id: string) => {
    if (!confirm('確定要刪除這個分類嗎？')) return
    await fetch(`/api/admin/character-categories/${id}`, { method: 'DELETE' }); refetchCats()
  }
  const handleCatMove = async (cat: CharacterCategory, dir: 'up' | 'down') => {
    const idx = categories.indexOf(cat)
    const target = dir === 'up' ? categories[idx - 1] : categories[idx + 1]
    if (!target) return
    await Promise.all([
      fetch(`/api/admin/character-categories/${cat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cat, sortOrder: target.sortOrder }) }),
      fetch(`/api/admin/character-categories/${target.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...target, sortOrder: cat.sortOrder }) }),
    ]); refetchCats()
  }

  const handleFilterAdd = async () => {
    if (!newValue.trim() || !newType.trim() || !selectedCatId) return
    setFilterSaving(true)
    try {
      const res = await fetch('/api/admin/character-filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: newType.trim(), value: newValue.trim(), categoryId: selectedCatId }) })
      if (res.ok) { setNewValue(''); refetchFilters() }
    } finally { setFilterSaving(false) }
  }
  const handleFilterDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/admin/character-filters/${id}`, { method: 'DELETE' }); refetchFilters()
  }
  const handleFilterSort = async (id: string, sortOrder: number) => {
    await fetch(`/api/admin/character-filters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder }) }); refetchFilters()
  }

  if (!isAdmin) return null

  const filtered = filterCatSlug === 'all' ? characters : characters.filter(c => c.CharacterCategory?.slug === filterCatSlug)

  // 根據當前分類推斷新增類型
  const selectedCat = categories.find(c => c.slug === filterCatSlug)
  const selectedCatName = selectedCat?.name ?? ''

  const currentOptions = filterOptions.filter(o => o.categoryId === selectedCatId)
  const existingTypes = Array.from(new Set(currentOptions.map(o => o.type))).sort()
  const groupedOptions = existingTypes.reduce((acc, type) => { acc[type] = currentOptions.filter(o => o.type === type).sort((a, b) => a.sortOrder - b.sortOrder); return acc }, {} as Record<string, FilterOption[]>)
  const allTypes = Array.from(new Set(filterOptions.map(o => o.type))).sort()

  const tabCls = (t: Tab) => `px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === t ? 'border-wiki-accent text-wiki-accent' : 'border-transparent text-wiki-text-muted hover:text-wiki-text'}`
  const catBtnCls = (active: boolean) => `px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${active ? 'bg-wiki-accent/20 text-wiki-accent border border-wiki-accent/40' : 'bg-wiki-gray text-wiki-text-muted border border-wiki-border hover:text-wiki-text'}`

  const newHeroLink = '/admin/characters/edit/new'
  const newHaojieLink = '/admin/characters/haojie/edit/new'

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">角色圖鑑管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理英雄與豪杰的列表、分類及篩選設定</p>
          </div>
          {activeTab === 'list' && filterCatSlug !== 'all' && (
            <div className="flex gap-2">
              {(selectedCatName.includes('豪') || selectedCatName.toLowerCase().includes('haojie')) && (
                <Link href={newHaojieLink} className="px-4 py-2 bg-wiki-gray border border-wiki-border text-wiki-text text-sm font-bold hover:border-wiki-accent transition-colors">
                  + 新增豪杰
                </Link>
              )}
              {(selectedCatName.includes('英雄') || selectedCatName.toLowerCase().includes('hero')) && (
                <Link href={newHeroLink} className="btn-hard text-wiki-text text-sm">
                  + 新增英雄
                </Link>
              )}
            </div>
          )}
          {activeTab === 'categories' && (
            <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }); setShowCatModal(true) }}
              className="btn-hard text-wiki-text text-sm">
              + 新增分類
            </button>
          )}
        </div>

        <div className="border-b border-wiki-border mb-6 flex">
          <button className={tabCls('list')} onClick={() => setActiveTab('list')}>角色列表</button>
          <button className={tabCls('categories')} onClick={() => setActiveTab('categories')}>分類管理</button>
          <button className={tabCls('filters')} onClick={() => setActiveTab('filters')}>篩選設定</button>
        </div>

        {loading ? <div className="text-center py-12 text-wiki-text-muted">載入中...</div> : (
          <>
            {/* ── 列表 ── */}
            {activeTab === 'list' && (
              <div>
                {/* 分類篩選 */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  <button onClick={() => setFilterCatSlug('all')} className={catBtnCls(filterCatSlug === 'all')}>全部分類</button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setFilterCatSlug(cat.slug)} className={catBtnCls(filterCatSlug === cat.slug)}>
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">
                    暫無數據
                  </div>
                ) : (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-wiki-gray">
                        <tr>
                          <th className="text-left px-4 py-3 text-wiki-accent font-bold text-sm">角色</th>
                          <th className="text-left px-4 py-3 text-wiki-accent font-bold text-sm">稀有度</th>
                          <th className="text-left px-4 py-3 text-wiki-accent font-bold text-sm">分類</th>
                          <th className="text-left px-4 py-3 text-wiki-accent font-bold text-sm">狀態</th>
                          <th className="text-right px-4 py-3 text-wiki-accent font-bold text-sm">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(c => (
                          <tr key={c.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {c.avatar
                                  ? <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-wiki-border" />
                                  : <div className="w-9 h-9 rounded-full bg-wiki-gray border border-wiki-border flex items-center justify-center text-wiki-text-muted text-sm">{c.name[0]}</div>}
                                <div>
                                  <div className="text-wiki-text font-bold text-sm">{c.name}</div>
                                  <div className="text-wiki-text-muted text-xs">{c.slug}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-bold ${c.rarity === '金' ? 'text-yellow-400' : c.rarity === '紫' ? 'text-purple-400' : 'text-blue-400'}`}>
                                {c.rarity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-wiki-text-muted text-sm">
                              {c.CharacterCategory?.name || '-'}
                              {c.awakenHero && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-yellow-900/20 text-yellow-400 border border-yellow-500/30">覺醒</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleTogglePublish(c)}
                                className={`px-2 py-1 text-xs font-bold rounded ${c.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {c.isPublished ? '已發佈' : '草稿'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Link href={editLink(c)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold hover:bg-wiki-accent/30 rounded">編輯</Link>
                                <button onClick={() => handleDelete(c)} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 rounded">刪除</button>
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

            {/* ── 分類管理 ── */}
            {activeTab === 'categories' && (
              <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-wiki-gray">
                    <tr>{['圖標', '名稱', '別名', '描述', '角色數', '排序', '操作'].map(h => <th key={h} className="text-left px-4 py-3 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                        <td className="px-4 py-3 text-2xl">{cat.icon}</td>
                        <td className="px-4 py-3 text-wiki-text font-bold text-sm">{cat.name}</td>
                        <td className="px-4 py-3 text-wiki-text-muted font-mono text-xs">{cat.slug}</td>
                        <td className="px-4 py-3 text-wiki-text-muted text-sm max-w-xs truncate">{cat.description}</td>
                        <td className="px-4 py-3 text-wiki-accent font-bold">{cat._count?.characters ?? 0}</td>
                        <td className="px-4 py-3 text-wiki-text-muted">{cat.sortOrder}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 items-center">
                            <button onClick={() => handleCatMove(cat, 'up')} disabled={idx === 0} className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold hover:bg-wiki-accent/30 disabled:opacity-30 rounded">↑</button>
                            <button onClick={() => handleCatMove(cat, 'down')} disabled={idx === categories.length - 1} className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold hover:bg-wiki-accent/30 disabled:opacity-30 rounded">↓</button>
                            <button onClick={() => handleCatEdit(cat)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold hover:bg-wiki-accent/30 rounded">編輯</button>
                            <button onClick={() => handleCatDelete(cat.id)} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 rounded">刪除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── 篩選設定 ── */}
            {activeTab === 'filters' && (
              <div>
                <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 mb-6 flex items-center gap-4 flex-wrap">
                  <span className="text-wiki-text font-bold text-sm flex-shrink-0">當前分類：</span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => setSelectedCatId(cat.id)}
                        className={`px-4 py-1.5 text-sm font-bold transition-colors ${selectedCatId === cat.id ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 mb-6">
                  <h3 className="text-base font-bold text-wiki-accent mb-4">添加篩選選項（到「{categories.find(c => c.id === selectedCatId)?.name ?? '...'}」）</h3>
                  <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-shrink-0">
                      <label className="block text-wiki-text-muted text-xs mb-1">篩選大類</label>
                      <input type="text" value={newType} onChange={e => setNewType(e.target.value)} list="type-suggestions"
                        className="w-40 bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none text-sm" placeholder="如：稀有度" />
                      <datalist id="type-suggestions">{allTypes.map(t => <option key={t} value={t} />)}</datalist>
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-wiki-text-muted text-xs mb-1">選項值</label>
                      <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFilterAdd()}
                        className="w-full bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none text-sm" placeholder="如：金色" />
                    </div>
                    <button onClick={handleFilterAdd} disabled={filterSaving || !newValue.trim() || !newType.trim() || !selectedCatId}
                      className="btn-hard text-wiki-text disabled:opacity-50 px-6 py-2 text-sm">添加</button>
                  </div>
                </div>
                {existingTypes.length === 0 ? (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">該分類暫無篩選選項</div>
                ) : (
                  <div className="space-y-4">
                    {existingTypes.map(type => (
                      <div key={type} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4">
                        <h3 className="text-sm font-bold text-wiki-accent mb-3">{type}</h3>
                        <div className="space-y-2">
                          {groupedOptions[type].map(opt => (
                            <div key={opt.id} className="flex items-center gap-4 bg-wiki-gray rounded p-2.5">
                              <input type="number" value={opt.sortOrder} onChange={e => handleFilterSort(opt.id, parseInt(e.target.value) || 0)}
                                className="w-16 bg-wiki-gray-light border border-wiki-border px-2 py-1 text-wiki-text text-center text-sm" />
                              <span className="text-wiki-text flex-1 text-sm">{opt.value}</span>
                              <button onClick={() => handleFilterDelete(opt.id)} className="text-red-400 text-sm hover:opacity-70">刪除</button>
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
            <h2 className="text-xl font-heading font-bold text-wiki-accent heading-hard mb-6">{editingCat ? '編輯分類' : '新增分類'}</h2>
            <form onSubmit={handleCatSubmit} className="space-y-4">
              {[
                { label: '名稱 *', key: 'name', required: true },
                { label: '別名 (URL Slug) *', key: 'slug', required: true },
                { label: '圖標 (Emoji)', key: 'icon', placeholder: '例如: ⚔️' },
              ].map(({ label, key, required, placeholder }) => (
                <div key={key}>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">{label}</label>
                  <input type="text" value={(catForm as any)[key]} onChange={e => setCatForm({ ...catForm, [key]: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    required={required} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">描述</label>
                <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-20" />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序</label>
                <input type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-hard text-wiki-text">保存</button>
                <button type="button" onClick={() => setShowCatModal(false)} className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WikiFooter />
    </div>
  )
}
