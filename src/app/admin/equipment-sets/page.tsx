'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import ImageUploadInput from '@/components/ImageUploadInput'

interface EquipmentSet {
  id: string
  name: string
  slug: string
  equipType: string
  icon: string
  iconPosition: string
  setBonus: string
  description: string
  sortOrder: number
  isPublished: boolean
  _count: { pieces: number }
}

const TYPE_LABELS: Record<string, string> = { hero: '英雄', leader: '首領' }
const TYPE_TABS = [
  { value: 'all', label: '全部' },
  { value: 'hero', label: '英雄套裝' },
  { value: 'leader', label: '首領套裝' },
]

const emptyForm = {
  name: '', slug: '', equipType: 'hero', icon: '', iconPosition: '50% 50%',
  setBonus: '', description: '', sortOrder: 0, isPublished: true,
}

export default function AdminEquipmentSetsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [sets, setSets] = useState<EquipmentSet[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<EquipmentSet | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchSets()
  }, [isAdmin, isLoaded, router])

  const fetchSets = () => {
    fetch('/api/admin/equipment-sets')
      .then(r => r.json())
      .then(d => { setSets(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) { alert('請填寫名稱和 Slug'); return }
    const url = editing ? `/api/admin/equipment-sets/${editing.id}` : '/api/admin/equipment-sets'
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { fetchSets(); setShowModal(false); setEditing(null); setForm(emptyForm) }
    else { const d = await res.json(); alert(d.error || '保存失敗') }
  }

  const handleEdit = (s: EquipmentSet) => {
    setEditing(s)
    setForm({
      name: s.name, slug: s.slug, equipType: s.equipType || 'hero',
      icon: s.icon || '', iconPosition: s.iconPosition || '50% 50%',
      setBonus: s.setBonus || '', description: s.description || '',
      sortOrder: s.sortOrder, isPublished: s.isPublished,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除這個套裝嗎？關聯的裝備會解除套裝歸屬（裝備本身不刪）。')) return
    await fetch(`/api/admin/equipment-sets/${id}`, { method: 'DELETE' })
    fetchSets()
  }

  if (!isAdmin) return null

  const filtered = tab === 'all' ? sets : sets.filter(s => s.equipType === tab)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">套裝管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理英雄/首領套裝，裝備錄入時可歸屬到套裝</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/equipment" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">裝備管理</Link>
            <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true) }} className="btn-hard text-wiki-text text-sm">+ 新增套裝</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {TYPE_TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-2 text-sm font-bold ${tab === t.value ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12 text-wiki-text-muted">載入中...</div> : (
          filtered.length === 0 ? (
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
                  {filtered.map(s => (
                    <tr key={s.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                      <td className="px-6 py-4">
                        {s.icon ? <img src={s.icon} alt={s.name} className="w-10 h-10 rounded object-cover" style={{ objectPosition: s.iconPosition || '50% 50%' }} /> : <div className="w-10 h-10 rounded bg-wiki-gray flex items-center justify-center text-wiki-text-muted">{s.name[0]}</div>}
                      </td>
                      <td className="px-6 py-4 text-wiki-text font-bold">{s.name}</td>
                      <td className="px-6 py-4 text-wiki-text text-sm">{TYPE_LABELS[s.equipType] || s.equipType}</td>
                      <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{s.slug}</td>
                      <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{s.setBonus}</td>
                      <td className="px-6 py-4 text-wiki-accent font-bold">{s._count.pieces}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold ${s.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-wiki-danger/20 text-wiki-danger'}`}>{s.isPublished ? '已發佈' : '草稿'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(s)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30">編輯</button>
                          <button onClick={() => handleDelete(s.id)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30">刪除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-heading font-bold text-wiki-accent heading-hard mb-6">{editing ? '編輯套裝' : '新增套裝'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">套裝名稱 *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" required />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">URL Slug *</label>
                <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" placeholder="英文小寫，如：street-set" required />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">所屬類型 *</label>
                <select value={form.equipType} onChange={e => set('equipType', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer">
                  <option value="hero">英雄</option>
                  <option value="leader">首領</option>
                </select>
              </div>
              <ImageUploadInput
                label="圖標"
                value={form.icon} position={form.iconPosition}
                onChange={url => set('icon', url)}
                onPositionChange={pos => set('iconPosition', pos)}
                compact
              />
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">套裝屬性加成</label>
                <textarea value={form.setBonus} onChange={e => set('setBonus', e.target.value)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-24" placeholder="如：2件套 攻擊+10%；4件套 生命+15%" />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序</label>
                <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} className="w-5 h-5 accent-wiki-accent cursor-pointer" />
                <span className="text-wiki-text font-bold text-sm">發佈（公開可見）</span>
              </label>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-hard text-wiki-text">保存</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WikiFooter />
    </div>
  )
}
