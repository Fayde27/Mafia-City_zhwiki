'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface SidebarSection {
  id: string
  name: string
  slug: string
  icon: string
  sortOrder: number
  isActive: boolean
}

export default function AdminSidebarSectionsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [sections, setSections] = useState<SidebarSection[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState<SidebarSection | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '◆', sortOrder: 0, isActive: true })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchSections()
  }, [isAdmin, isLoaded, router])

  const fetchSections = () => {
    fetch('/api/admin/sidebar-sections')
      .then(res => res.json())
      .then(data => { setSections(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const openNew = () => {
    setEditingSection(null)
    setFormData({ name: '', slug: '', icon: '◆', sortOrder: 0, isActive: true })
    setShowModal(true)
  }

  const openEdit = (section: SidebarSection) => {
    setEditingSection(section)
    setFormData({ name: section.name, slug: section.slug, icon: section.icon || '◆', sortOrder: section.sortOrder, isActive: section.isActive })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingSection
        ? `/api/admin/sidebar-sections/${editingSection.id}`
        : '/api/admin/sidebar-sections'
      const method = editingSection ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) { fetchSections(); setShowModal(false) }
      else { const d = await res.json(); alert(d.error || '保存失敗') }
    } catch { alert('網絡錯誤') }
  }

  const handleDelete = async (section: SidebarSection) => {
    if (!confirm(`確定刪除"${section.name}"分類？該分類下的導航項將不再歸屬此分類。`)) return
    try {
      const res = await fetch(`/api/admin/sidebar-sections/${section.id}`, { method: 'DELETE' })
      if (res.ok) fetchSections()
      else alert('刪除失敗')
    } catch { alert('網絡錯誤') }
  }

  const handleToggle = async (section: SidebarSection) => {
    try {
      const res = await fetch(`/api/admin/sidebar-sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...section, isActive: !section.isActive }),
      })
      if (res.ok) fetchSections()
    } catch { alert('操作失敗') }
  }

  // 自動生成 slug
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || formData.slug
    setFormData(prev => ({ ...prev, name, slug: editingSection ? prev.slug : slug }))
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">側邊欄分類管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理首頁側邊欄的分類區塊，可自由增刪改名稱和排序</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/sidebar-nav" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
              管理導航項
            </Link>
            <button onClick={openNew} className="btn-hard text-wiki-text text-sm">
              + 新增分類
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
            {sections.length === 0 ? (
              <div className="p-12 text-center text-wiki-text-muted">暫無分類，點擊上方按鈕新增</div>
            ) : (
              <table className="w-full">
                <thead className="bg-wiki-gray">
                  <tr>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">分類名稱</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">標識符 (Slug)</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">排序值</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">狀態</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map(section => (
                    <tr key={section.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                      <td className="px-6 py-4 font-bold text-wiki-text">
                        <span className="text-wiki-accent mr-2">{section.icon || '◆'}</span>{section.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-wiki-text-muted text-sm">{section.slug}</td>
                      <td className="px-6 py-4 text-wiki-text-muted">{section.sortOrder}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(section)}
                          className={`px-3 py-1 text-xs font-bold rounded border ${
                            section.isActive
                              ? 'bg-green-500/20 text-green-400 border-green-500/40'
                              : 'bg-wiki-gray text-wiki-text-muted border-wiki-border'
                          }`}
                        >
                          {section.isActive ? '顯示中' : '已隱藏'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(section)}
                            className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded border border-wiki-accent/40 hover:bg-wiki-accent/30"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(section)}
                            className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-xs font-bold rounded border border-wiki-danger/40 hover:bg-wiki-danger/30"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-wiki-gray-light border border-wiki-border rounded-lg text-wiki-text-muted text-sm">
          <p className="font-bold text-wiki-text mb-1">💡 使用說明</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>分類決定側邊欄顯示哪些區塊（如"新手快速入口"、"快捷功能"）</li>
            <li>標識符 (Slug) 用於關聯導航項，創建後建議不要修改</li>
            <li>在"管理導航項"中，為每個導航項指定所屬分類</li>
            <li>排序值越大越靠前</li>
          </ul>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-heading font-bold text-wiki-accent heading-hard mb-6">
              {editingSection ? '編輯分類' : '新增分類'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">標題圖標</label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 text-center">{formData.icon || '◆'}</span>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="flex-1 bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="可輸入 emoji 或符號，如 ⚔️ 🏆 ★"
                    maxLength={4}
                  />
                </div>
                <p className="text-wiki-text-muted text-xs mt-1">顯示在分類標題左側，預設為 ◆</p>
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">分類名稱 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  placeholder="如: 新手快速入口"
                  required
                />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">標識符 (Slug) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none font-mono"
                  placeholder="如: quick-entry"
                  required
                />
                <p className="text-wiki-text-muted text-xs mt-1">僅限英文小寫、數字和連字符，用於關聯導航項</p>
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序值</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  placeholder="數字越大越靠前"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 accent-wiki-accent"
                  />
                  <span className="text-wiki-text font-bold">在側邊欄顯示</span>
                </label>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="submit" className="btn-hard text-wiki-text">保存</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WikiFooter />
    </div>
  )
}
