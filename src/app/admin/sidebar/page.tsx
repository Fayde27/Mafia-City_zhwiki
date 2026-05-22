'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

type Tab = 'nav' | 'sections'

interface SidebarNavItem {
  id: string; section: string; label: string; icon: string | null
  href: string; parentId: string | null; sortOrder: number; isActive: boolean
  children?: SidebarNavItem[]
}
interface SidebarSection {
  id: string; name: string; slug: string; icon: string; sortOrder: number; isActive: boolean
}

export default function AdminSidebarPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<Tab>('nav')
  const [loading, setLoading] = useState(true)

  const [items, setItems] = useState<SidebarNavItem[]>([])
  const [sections, setSections] = useState<SidebarSection[]>([])
  const [filterSection, setFilterSection] = useState('all')

  const [showSectionModal, setShowSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState<SidebarSection | null>(null)
  const [sectionForm, setSectionForm] = useState({ name: '', slug: '', icon: '◆', sortOrder: 0, isActive: true })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchAll()
  }, [isAdmin, isLoaded, router])

  const fetchAll = async () => {
    try {
      const [navRes, sectRes] = await Promise.all([
        fetch('/api/admin/sidebar-nav').then(r => r.json()),
        fetch('/api/admin/sidebar-sections').then(r => r.json()),
      ])
      setItems(Array.isArray(navRes) ? navRes : [])
      setSections(Array.isArray(sectRes) ? sectRes : [])
    } finally { setLoading(false) }
  }

  const refetchNav = () => fetch('/api/admin/sidebar-nav').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []))
  const refetchSections = () => fetch('/api/admin/sidebar-sections').then(r => r.json()).then(d => setSections(Array.isArray(d) ? d : []))

  const handleNavDelete = async (id: string, hasChildren: boolean) => {
    if (!confirm(hasChildren ? '此項有子菜單，確定刪除？' : '確定刪除？')) return
    await fetch(`/api/admin/sidebar-nav/${id}`, { method: 'DELETE' }); refetchNav()
  }
  const handleNavToggle = async (item: SidebarNavItem) => {
    await fetch(`/api/admin/sidebar-nav/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, isActive: !item.isActive }) })
    refetchNav()
  }

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingSection ? `/api/admin/sidebar-sections/${editingSection.id}` : '/api/admin/sidebar-sections'
    const res = await fetch(url, { method: editingSection ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sectionForm) })
    if (res.ok) { refetchSections(); setShowSectionModal(false); setEditingSection(null); setSectionForm({ name: '', slug: '', icon: '◆', sortOrder: 0, isActive: true }) }
    else { const d = await res.json(); alert(d.error || '保存失敗') }
  }
  const handleSectionEdit = (s: SidebarSection) => { setEditingSection(s); setSectionForm({ name: s.name, slug: s.slug, icon: s.icon || '◆', sortOrder: s.sortOrder, isActive: s.isActive }); setShowSectionModal(true) }
  const handleSectionDelete = async (s: SidebarSection) => {
    if (!confirm(`確定刪除「${s.name}」分類？`)) return
    await fetch(`/api/admin/sidebar-sections/${s.id}`, { method: 'DELETE' }); refetchSections()
  }
  const handleSectionToggle = async (s: SidebarSection) => {
    await fetch(`/api/admin/sidebar-sections/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, isActive: !s.isActive }) })
    refetchSections()
  }

  if (!isAdmin) return null

  const getSectionLabel = (slug: string) => sections.find(s => s.slug === slug)?.name || slug
  const filteredNav = filterSection === 'all' ? items : items.filter(i => i.section === filterSection)
  const groupedNav = filteredNav.reduce((acc, item) => { if (!acc[item.section]) acc[item.section] = []; acc[item.section].push(item); return acc }, {} as Record<string, SidebarNavItem[]>)
  const tabCls = (t: Tab) => `px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === t ? 'border-wiki-accent text-wiki-accent' : 'border-transparent text-wiki-text-muted hover:text-wiki-text'}`

  const renderNavItem = (item: SidebarNavItem, isChild = false) => (
    <div key={item.id}>
      <div className={`px-6 py-4 flex items-center justify-between ${isChild ? 'bg-wiki-gray/30 pl-12 border-l-4 border-wiki-accent/30' : ''}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {isChild && <span className="text-wiki-text-muted text-xs">└</span>}
          {item.icon && <span className="text-xl flex-shrink-0">{item.icon}</span>}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-wiki-text">{item.label}</span>
              {(item.children?.length ?? 0) > 0 && <span className="px-2 py-0.5 bg-wiki-accent/20 text-wiki-accent text-xs rounded">{item.children!.length} 個子菜單</span>}
              {!item.isActive && <span className="px-2 py-0.5 bg-wiki-gray text-wiki-text-muted text-xs rounded">已隱藏</span>}
            </div>
            <span className="text-wiki-text-muted text-sm truncate block">{item.href || <em className="opacity-50">無連結</em>}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => handleNavToggle(item)} className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${item.isActive ? 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30' : 'bg-wiki-gray text-wiki-text-muted border-wiki-border hover:border-wiki-accent/50'}`}>{item.isActive ? '顯示中' : '已隱藏'}</button>
          <Link href={`/admin/sidebar-nav/${item.id}`} className="px-3 py-1.5 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded border border-wiki-accent/40 hover:bg-wiki-accent/30">編輯</Link>
          <button onClick={() => handleNavDelete(item.id, (item.children?.length ?? 0) > 0)} className="px-3 py-1.5 bg-wiki-danger/20 text-wiki-danger text-xs font-bold rounded border border-wiki-danger/40 hover:bg-wiki-danger/30">刪除</button>
        </div>
      </div>
      {item.children && item.children.length > 0 && (
        <div className="divide-y divide-wiki-border/50">{item.children.map(child => renderNavItem(child, true))}</div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">側邊欄管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理側邊欄導航項及分類區塊</p>
          </div>
          {activeTab === 'nav' && <Link href="/admin/sidebar-nav/new" className="btn-hard text-wiki-text text-sm">+ 新增導航項</Link>}
          {activeTab === 'sections' && <button onClick={() => { setEditingSection(null); setSectionForm({ name: '', slug: '', icon: '◆', sortOrder: 0, isActive: true }); setShowSectionModal(true) }} className="btn-hard text-wiki-text text-sm">+ 新增分類</button>}
        </div>

        <div className="border-b border-wiki-border mb-6 flex">
          <button className={tabCls('nav')} onClick={() => setActiveTab('nav')}>導航管理</button>
          <button className={tabCls('sections')} onClick={() => setActiveTab('sections')}>分區管理</button>
        </div>

        {loading ? <div className="text-center py-12 text-wiki-text-muted">載入中...</div> : (
          <>
            {activeTab === 'nav' && (
              <div>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {[{ value: 'all', label: '全部' }, ...sections.map(s => ({ value: s.slug, label: s.name }))].map(tab => (
                    <button key={tab.value} onClick={() => setFilterSection(tab.value)} className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${filterSection === tab.value ? 'bg-wiki-accent/20 border-wiki-accent text-wiki-accent' : 'bg-wiki-gray border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'}`}>{tab.label}</button>
                  ))}
                </div>
                {items.length === 0 ? (
                  <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">暫無導航項，點擊上方按鈕新增</div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedNav).map(([section, sectionItems]) => (
                      <div key={section} className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-wiki-border bg-wiki-gray flex items-center justify-between">
                          <h2 className="text-lg font-bold text-wiki-text">{getSectionLabel(section)}</h2>
                          <span className="text-wiki-text-muted text-xs">{sectionItems.length} 個頂級項</span>
                        </div>
                        <div className="divide-y divide-wiki-border">{sectionItems.map(item => renderNavItem(item))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sections' && (
              <div>
                <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                  {sections.length === 0 ? (
                    <div className="p-12 text-center text-wiki-text-muted">暫無分類</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-wiki-gray">
                        <tr>{['圖標', '分類名稱', 'Slug', '排序', '狀態', '操作'].map(h => <th key={h} className="text-left px-6 py-4 text-wiki-accent font-bold text-sm">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {sections.map(s => (
                          <tr key={s.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                            <td className="px-6 py-4 text-wiki-accent text-xl">{s.icon || '◆'}</td>
                            <td className="px-6 py-4 text-wiki-text font-bold">{s.name}</td>
                            <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{s.slug}</td>
                            <td className="px-6 py-4 text-wiki-text-muted">{s.sortOrder}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleSectionToggle(s)} className={`px-3 py-1 text-xs font-bold rounded border ${s.isActive ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-wiki-gray text-wiki-text-muted border-wiki-border'}`}>{s.isActive ? '顯示中' : '已隱藏'}</button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => handleSectionEdit(s)} className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded border border-wiki-accent/40 hover:bg-wiki-accent/30">編輯</button>
                                <button onClick={() => handleSectionDelete(s)} className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-xs font-bold rounded border border-wiki-danger/40 hover:bg-wiki-danger/30">刪除</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showSectionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-heading font-bold text-wiki-accent heading-hard mb-6">{editingSection ? '編輯分類' : '新增分類'}</h2>
            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">標題圖標</label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 text-center">{sectionForm.icon || '◆'}</span>
                  <input type="text" value={sectionForm.icon} onChange={e => setSectionForm(p => ({ ...p, icon: e.target.value }))} className="flex-1 bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" placeholder="可輸入 emoji 或符號" maxLength={4} />
                </div>
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">分類名稱 *</label>
                <input type="text" value={sectionForm.name} onChange={e => setSectionForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" required />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">Slug *</label>
                <input type="text" value={sectionForm.slug} onChange={e => setSectionForm(p => ({ ...p, slug: e.target.value }))} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none font-mono" required />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序值</label>
                <input type="number" value={sectionForm.sortOrder} onChange={e => setSectionForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sectionForm.isActive} onChange={e => setSectionForm(p => ({ ...p, isActive: e.target.checked }))} className="w-5 h-5 accent-wiki-accent" />
                <span className="text-wiki-text font-bold">在側邊欄顯示</span>
              </label>
              <div className="flex gap-4 pt-2">
                <button type="submit" className="btn-hard text-wiki-text">保存</button>
                <button type="button" onClick={() => setShowSectionModal(false)} className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WikiFooter />
    </div>
  )
}
