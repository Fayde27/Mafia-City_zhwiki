'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import ImageUploadInput from '@/components/ImageUploadInput'
import { FILTER_FIELDS, fieldLabel, rarityInfo, rarityTiersFor, filterValuePresets } from '@/lib/equipment'

type Tab = 'list' | 'categories' | 'filters' | 'sets'

const FILTER_EQUIP_TYPES = [
  { value: 'haojie_weapon',   label: '豪傑武器' },
  { value: 'haojie_warbadge', label: '豪傑戰徽' },
  { value: 'leader',          label: '首領裝備' },
  { value: 'hero',            label: '英雄裝備' },
]

const EQUIP_TYPES = [
  { value: 'all',             label: '全部' },
  { value: 'haojie_weapon',   label: '豪傑武器' },
  { value: 'haojie_warbadge', label: '豪傑戰徽' },
  { value: 'leader',          label: '首領裝備' },
  { value: 'hero',            label: '英雄裝備' },
]
const EQUIP_TYPE_LABELS: Record<string, string> = {
  haojie_weapon: '豪傑武器', haojie_warbadge: '豪傑戰徽', leader: '首領裝備', hero: '英雄裝備',
}

interface EntityItem {
  id: string; name: string; slug: string; rarity: number
  isPublished: boolean; sortOrder: number
  icon?: string; type?: string; slot?: string; equipType?: string
  category?: { name: string; slug: string }
  EquipmentCategory?: { name: string; slug: string }
}
interface EntityCategory {
  id: string; name: string; slug: string; description: string
  icon: string; sortOrder: number
  _count: { equipment: number }
}
interface FilterOption { id: string; type: string; value: string; field?: string; equipType?: string; sortOrder: number; categoryId?: string }

interface EquipmentSet {
  id: string; name: string; slug: string; equipType: string
  icon: string; iconPosition: string; setBonus: string
  description: string; sortOrder: number; isPublished: boolean
  _count: { pieces: number }
}

const SET_TYPE_TABS = [
  { value: 'all', label: '全部' },
  { value: 'hero', label: '英雄套裝' },
  { value: 'leader', label: '首領套裝' },
]
const SET_TYPE_LABELS: Record<string, string> = { hero: '英雄', leader: '首領' }
const emptySetForm = { name: '', slug: '', equipType: 'hero', icon: '', iconPosition: '50% 50%', setBonus: '', description: '', sortOrder: 0, isPublished: true }

export default function AdminEquipmentPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<EntityItem[]>([])
  const [typeTab, setTypeTab] = useState('all')
  const [filterCatSlug, setFilterCatSlug] = useState('all')
  const [categories, setCategories] = useState<EntityCategory[]>([])
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<EntityCategory | null>(null)
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([])
  const [selectedCatId, setSelectedCatId] = useState('')
  const [filterEquipType, setFilterEquipType] = useState('haojie_weapon')
  const [newField, setNewField] = useState('rarity')
  const [newType, setNewType] = useState('')
  const [newValue, setNewValue] = useState('')
  const [filterSaving, setFilterSaving] = useState(false)
  // Sets
  const [sets, setSets] = useState<EquipmentSet[]>([])
  const [setsTypeTab, setSetsTypeTab] = useState('all')
  const [showSetModal, setShowSetModal] = useState(false)
  const [editingSet, setEditingSet] = useState<EquipmentSet | null>(null)
  const [setForm, setSetForm] = useState(emptySetForm)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchAll()
  }, [isAdmin, isLoaded, router])

  const fetchAll = async () => {
    try {
      const [itemRes, catRes, filterRes, setRes] = await Promise.all([
        fetch('/api/admin/equipment').then(r => r.json()),
        fetch('/api/admin/equipment-categories').then(r => r.json()),
        fetch('/api/admin/equipment-filters').then(r => r.json()),
        fetch('/api/admin/equipment-sets').then(r => r.json()),
      ])
      const raw = itemRes?.equipment || itemRes
      setItems(Array.isArray(raw) ? raw : [])
      const cats = Array.isArray(catRes) ? catRes : []
      setCategories(cats)
      if (cats.length > 0) setSelectedCatId(cats[0].id)
      setFilterOptions(Array.isArray(filterRes) ? filterRes : [])
      setSets(Array.isArray(setRes) ? setRes : [])
    } finally { setLoading(false) }
  }

  const refetchSets = () => fetch('/api/admin/equipment-sets').then(r => r.json()).then(d => setSets(Array.isArray(d) ? d : []))

  const refetchItems = async () => {
    const d = await fetch('/api/admin/equipment').then(r => r.json())
    const raw = d?.equipment || d; setItems(Array.isArray(raw) ? raw : [])
  }
  const refetchCats = () => fetch('/api/admin/equipment-categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []))
  const refetchFilters = () => fetch('/api/admin/equipment-filters').then(r => r.json()).then(d => setFilterOptions(Array.isArray(d) ? d : []))

  const handleTogglePublish = async (item: EntityItem) => {
    await fetch(`/api/admin/equipment/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, isPublished: !item.isPublished }) })
    refetchItems()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除嗎？')) return
    await fetch(`/api/admin/equipment/${id}`, { method: 'DELETE' }); refetchItems()
  }

  const handleCatSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const url = editingCat ? `/api/admin/equipment-categories/${editingCat.id}` : '/api/admin/equipment-categories'
    const res = await fetch(url, { method: editingCat ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) })
    if (res.ok) { refetchCats(); setShowCatModal(false); setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }) }
    else { const d = await res.json(); alert(d.error || '保存失敗') }
  }
  const handleCatEdit = (cat: EntityCategory) => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', sortOrder: cat.sortOrder }); setShowCatModal(true) }
  const handleCatDelete = async (id: string) => {
    if (!confirm('確定要刪除這個分類嗎？')) return
    await fetch(`/api/admin/equipment-categories/${id}`, { method: 'DELETE' }); refetchCats()
  }
  const handleCatMove = async (cat: EntityCategory, dir: 'up' | 'down') => {
    const idx = categories.indexOf(cat)
    const target = dir === 'up' ? categories[idx - 1] : categories[idx + 1]
    if (!target) return
    await Promise.all([
      fetch(`/api/admin/equipment-categories/${cat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cat, sortOrder: target.sortOrder }) }),
      fetch(`/api/admin/equipment-categories/${target.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...target, sortOrder: cat.sortOrder }) }),
    ]); refetchCats()
  }

  const handleFilterAdd = async () => {
    if (!newValue.trim() || !newField || !filterEquipType) return
    const label = newType.trim() || fieldLabel(filterEquipType, newField)
    setFilterSaving(true)
    try {
      const res = await fetch('/api/admin/equipment-filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: label, value: newValue.trim(), field: newField, equipType: filterEquipType }) })
      if (res.ok) { setNewValue(''); refetchFilters() }
    } finally { setFilterSaving(false) }
  }
  const handleFilterDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/admin/equipment-filters/${id}`, { method: 'DELETE' }); refetchFilters()
  }
  const handleFilterSort = async (id: string, sortOrder: number) => {
    await fetch(`/api/admin/equipment-filters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder }) }); refetchFilters()
  }

  const handleSetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setForm.name.trim() || !setForm.slug.trim()) { alert('請填寫名稱和 Slug'); return }
    const url = editingSet ? `/api/admin/equipment-sets/${editingSet.id}` : '/api/admin/equipment-sets'
    const res = await fetch(url, { method: editingSet ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(setForm) })
    if (res.ok) { refetchSets(); setShowSetModal(false); setEditingSet(null); setSetForm(emptySetForm) }
    else { const d = await res.json(); alert(d.error || '保存失敗') }
  }
  const handleSetEdit = (s: EquipmentSet) => {
    setEditingSet(s)
    setSetForm({ name: s.name, slug: s.slug, equipType: s.equipType || 'hero', icon: s.icon || '', iconPosition: s.iconPosition || '50% 50%', setBonus: s.setBonus || '', description: s.description || '', sortOrder: s.sortOrder, isPublished: s.isPublished })
    setShowSetModal(true)
  }
  const handleSetDelete = async (id: string) => {
    if (!confirm('確定刪除這個套裝嗎？關聯的裝備會解除套裝歸屬（裝備本身不刪）。')) return
    await fetch(`/api/admin/equipment-sets/${id}`, { method: 'DELETE' }); refetchSets()
  }
  const setField = (key: string, val: any) => setSetForm(f => ({ ...f, [key]: val }))

  if (!isAdmin) return null

  const filtered = items
    .filter(eq => typeTab === 'all' || eq.equipType === typeTab)
    .filter(eq => filterCatSlug === 'all' || (eq.category?.slug || eq.EquipmentCategory?.slug) === filterCatSlug)
  // 篩選設定：按當前 equipType 過濾，再按 field 分組
  const availableFields = FILTER_FIELDS[filterEquipType] || []
  const currentOptions = filterOptions.filter(o => o.equipType === filterEquipType)
  const existingFields = availableFields.map(f => f.field).filter(fld => currentOptions.some(o => o.field === fld))
  const groupedOptions = existingFields.reduce((acc, fld) => { acc[fld] = currentOptions.filter(o => o.field === fld).sort((a, b) => a.sortOrder - b.sortOrder); return acc }, {} as Record<string, FilterOption[]>)
  // 「選項值」候選：標準全集（品質檔位/部位/種類）並上真實數據裡出現過的值，去重
  const presetVals = filterValuePresets(filterEquipType, newField)
  const realVals = Array.from(new Set(items.filter(e => e.equipType === filterEquipType).map(e => (e as any)[newField]).filter(Boolean).map(String)))
  const valueCandidates: { value: string; label: string }[] = [...presetVals]
  realVals.forEach(v => { if (!valueCandidates.some(c => c.value === v)) valueCandidates.push({ value: v, label: v }) })
  const getRarityStars = (r: number) => '★'.repeat(Math.max(0, r)) + '☆'.repeat(Math.max(0, 5 - r))
  const tabCls = (t: Tab) => `px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === t ? 'border-wiki-accent text-wiki-accent' : 'border-transparent text-wiki-text-muted hover:text-wiki-text'}`

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">裝備圖鑑管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理裝備列表、分類及篩選設定</p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'list' && <Link href={`/admin/equipment/new${typeTab !== 'all' ? `?type=${typeTab}` : ''}`} className="btn-hard text-wiki-text text-sm">+ 新增裝備</Link>}
            {activeTab === 'categories' && <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 }); setShowCatModal(true) }} className="btn-hard text-wiki-text text-sm">+ 新增分類</button>}
            {activeTab === 'sets' && <button onClick={() => { setEditingSet(null); setSetForm(emptySetForm); setShowSetModal(true) }} className="btn-hard text-wiki-text text-sm">+ 新增套裝</button>}
          </div>
        </div>

        <div className="border-b border-wiki-border mb-6 flex">
          <button className={tabCls('list')} onClick={() => setActiveTab('list')}>裝備列表</button>
          <button className={tabCls('categories')} onClick={() => setActiveTab('categories')}>分類管理</button>
          <button className={tabCls('filters')} onClick={() => setActiveTab('filters')}>篩選設定</button>
          <button className={tabCls('sets')} onClick={() => setActiveTab('sets')}>套裝管理</button>
        </div>

        {loading ? <div className="text-center py-12 text-wiki-text-muted">載入中...</div> : (
          <>
            {activeTab === 'list' && (
              <div>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-wiki-border">
                  {EQUIP_TYPES.map(t => <button key={t.value} onClick={() => setTypeTab(t.value)} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${typeTab === t.value ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>{t.label}</button>)}
                </div>
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  <button onClick={() => setFilterCatSlug('all')} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${filterCatSlug === 'all' ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>全部分類</button>
                  {categories.map(cat => <button key={cat.id} onClick={() => setFilterCatSlug(cat.slug)} className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${filterCatSlug === cat.slug ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>{cat.icon} {cat.name}</button>)}
                </div>
                {filtered.length === 0 ? <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">暫無裝備數據</div> : (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-wiki-gray">
                        <tr>{["裝備","稀有度","類型","部位","分類","狀態","操作"].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filtered.map(eq => (
                          <tr key={eq.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {eq.icon ? <img src={eq.icon} alt={eq.name} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-wiki-gray flex items-center justify-center text-wiki-text-muted">{eq.name[0]}</div>}
                                <div>
                                  <div className="text-wiki-text font-bold">{eq.name}</div>
                                  {eq.equipType && <span className="text-wiki-accent text-xs">{EQUIP_TYPE_LABELS[eq.equipType] || eq.equipType}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-yellow-400 text-sm">{getRarityStars(eq.rarity)}</td>
                            <td className="px-6 py-4 text-wiki-text text-sm">{eq.type || '-'}</td>
                            <td className="px-6 py-4 text-wiki-text text-sm">{eq.slot || '-'}</td>
                            <td className="px-6 py-4 text-wiki-text-muted text-sm">{eq.category?.name || eq.EquipmentCategory?.name || '-'}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleTogglePublish(eq)} className={`px-2 py-1 text-xs font-bold ${eq.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-wiki-danger/20 text-wiki-danger'}`}>{eq.isPublished ? '已發佈' : '草稿'}</button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Link href={`/admin/equipment/edit/${eq.id}`} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">編輯</Link>
                                <button onClick={() => handleDelete(eq.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">刪除</button>
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
                    <tr>{['圖標', '名稱', '別名', '描述', '裝備數', '排序', '操作'].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                        <td className="px-6 py-4 text-2xl">{cat.icon}</td>
                        <td className="px-6 py-4 text-wiki-text font-bold">{cat.name}</td>
                        <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{cat.slug}</td>
                        <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{cat.description}</td>
                        <td className="px-6 py-4 text-wiki-accent font-bold">{cat._count.equipment}</td>
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
                  <span className="text-wiki-text font-bold text-sm flex-shrink-0">裝備類型：</span>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_EQUIP_TYPES.map(t => <button key={t.value} onClick={() => { setFilterEquipType(t.value); setNewField((FILTER_FIELDS[t.value]?.[0]?.field) || 'rarity'); setNewValue(''); setNewType('') }} className={`px-4 py-1.5 text-sm font-bold transition-colors ${filterEquipType === t.value ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>{t.label}</button>)}
                  </div>
                </div>
                <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-wiki-accent mb-4">添加篩選選項（到「{EQUIP_TYPE_LABELS[filterEquipType]}」）</h3>
                  <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-shrink-0">
                      <label className="block text-wiki-text-muted text-xs mb-1">篩選字段</label>
                      <select value={newField} onChange={ev => { setNewField(ev.target.value); setNewValue(''); setNewType('') }} className="w-40 bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer">
                        {availableFields.map(f => <option key={f.field} value={f.field}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="flex-shrink-0">
                      <label className="block text-wiki-text-muted text-xs mb-1">顯示名（可留空取字段名）</label>
                      <input type="text" value={newType} onChange={ev => setNewType(ev.target.value)} className="w-40 bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none" placeholder={fieldLabel(filterEquipType, newField)} />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-wiki-text-muted text-xs mb-1">選項值</label>
                      <select value={newValue} onChange={ev => setNewValue(ev.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer">
                        <option value="">— 選擇值 —</option>
                        {valueCandidates.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                      </select>
                    </div>
                    <button onClick={handleFilterAdd} disabled={filterSaving || !newValue.trim() || !newField} className="btn-hard text-wiki-text disabled:opacity-50 px-6 py-2">添加</button>
                  </div>
                  <p className="text-wiki-text-muted text-xs mt-3">選項值來自該類型裝備的真實數據，點選後前台按此字段過濾。品質欄顯示為檔位名。</p>
                </div>
                {existingFields.length === 0 ? (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">該類型暫無篩選選項</div>
                ) : (
                  <div className="space-y-4">
                    {existingFields.map(fld => (
                      <div key={fld} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
                        <h3 className="text-lg font-bold text-wiki-accent mb-4">{groupedOptions[fld][0]?.type || fieldLabel(filterEquipType, fld)}</h3>
                        <div className="space-y-2">
                          {groupedOptions[fld].map(opt => (
                            <div key={opt.id} className="flex items-center gap-4 bg-wiki-gray rounded-lg p-3">
                              <input type="number" value={opt.sortOrder} onChange={ev => handleFilterSort(opt.id, parseInt(ev.target.value) || 0)} className="w-16 bg-wiki-carder border border-wiki-border px-2 py-1 text-wiki-text text-center" />
                              <span className="text-wiki-text flex-1">{fld === 'rarity' ? (rarityInfo(parseInt(opt.value))?.label || opt.value) : opt.value}</span>
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
            {activeTab === 'sets' && (
              <div>
                <div className="flex gap-2 mb-6">
                  {SET_TYPE_TABS.map(t => (
                    <button key={t.value} onClick={() => setSetsTypeTab(t.value)}
                      className={`px-4 py-2 text-sm font-bold ${setsTypeTab === t.value ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {(() => {
                  const filteredSets = setsTypeTab === 'all' ? sets : sets.filter(s => s.equipType === setsTypeTab)
                  return filteredSets.length === 0 ? (
                    <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">暫無套裝</div>
                  ) : (
                    <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-wiki-gray">
                          <tr>{['圖標', '名稱', '類型', 'Slug', '套裝加成', '件數', '狀態', '操作'].map(h => (
                            <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {filteredSets.map(s => (
                            <tr key={s.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                              <td className="px-6 py-4">
                                {s.icon ? <img src={s.icon} alt={s.name} className="w-10 h-10 rounded object-cover" style={{ objectPosition: s.iconPosition || '50% 50%' }} /> : <div className="w-10 h-10 rounded bg-wiki-gray flex items-center justify-center text-wiki-text-muted">{s.name[0]}</div>}
                              </td>
                              <td className="px-6 py-4 text-wiki-text font-bold">{s.name}</td>
                              <td className="px-6 py-4 text-wiki-text text-sm">{SET_TYPE_LABELS[s.equipType] || s.equipType}</td>
                              <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{s.slug}</td>
                              <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{s.setBonus}</td>
                              <td className="px-6 py-4 text-wiki-accent font-bold">{s._count.pieces}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-bold ${s.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-wiki-danger/20 text-wiki-danger'}`}>{s.isPublished ? '已發佈' : '草稿'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => handleSetEdit(s)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">編輯</button>
                                  <button onClick={() => handleSetDelete(s.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">刪除</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </main>

      {showSetModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-heading font-bold text-wiki-accent heading-hard mb-6">{editingSet ? '編輯套裝' : '新增套裝'}</h2>
            <form onSubmit={handleSetSubmit} className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">套裝名稱 *</label>
                <input type="text" value={setForm.name} onChange={e => setField('name', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" required />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">URL Slug *</label>
                <input type="text" value={setForm.slug} onChange={e => setField('slug', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" placeholder="英文小寫，如：street-set" required />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">所屬類型 *</label>
                <select value={setForm.equipType} onChange={e => setField('equipType', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer">
                  <option value="hero">英雄</option>
                  <option value="leader">首領</option>
                </select>
              </div>
              <ImageUploadInput
                label="圖標"
                value={setForm.icon} position={setForm.iconPosition}
                onChange={url => setField('icon', url)}
                onPositionChange={pos => setField('iconPosition', pos)}
                compact
              />
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">套裝屬性加成</label>
                <textarea value={setForm.setBonus} onChange={e => setField('setBonus', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-24" placeholder="如：2件套 攻擊+10%；4件套 生命+15%" />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序</label>
                <input type="number" value={setForm.sortOrder} onChange={e => setField('sortOrder', parseInt(e.target.value) || 0)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={setForm.isPublished} onChange={e => setField('isPublished', e.target.checked)} className="w-5 h-5 accent-wiki-accent cursor-pointer" />
                <span className="text-wiki-text font-bold text-sm">發佈（公開可見）</span>
              </label>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-hard text-wiki-text">保存</button>
                <button type="button" onClick={() => setShowSetModal(false)} className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
