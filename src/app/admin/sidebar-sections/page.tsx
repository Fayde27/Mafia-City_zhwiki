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
  sortOrder: number
  isActive: boolean
}

export default function AdminSidebarSectionsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [sections, setSections] = useState<SidebarSection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState<SidebarSection | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', sortOrder: 0, isActive: true })

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
    setFormData({ name: '', slug: '', sortOrder: 0, isActive: true })
    setShowModal(true)
  }

  const openEdit = (section: SidebarSection) => {
    setEditingSection(section)
    setFormData({ name: section.name, slug: section.slug, sortOrder: section.sortOrder, isActive: section.isActive })
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
      else { const d = await res.json(); alert(d.error || '保存失败') }
    } catch { alert('网络错误') }
  }

  const handleDelete = async (section: SidebarSection) => {
    if (!confirm(`确定删除"${section.name}"分类？该分类下的导航项将不再归属此分类。`)) return
    try {
      const res = await fetch(`/api/admin/sidebar-sections/${section.id}`, { method: 'DELETE' })
      if (res.ok) fetchSections()
      else alert('删除失败')
    } catch { alert('网络错误') }
  }

  const handleToggle = async (section: SidebarSection) => {
    try {
      const res = await fetch(`/api/admin/sidebar-sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...section, isActive: !section.isActive }),
      })
      if (res.ok) fetchSections()
    } catch { alert('操作失败') }
  }

  // 自动生成 slug
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
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">侧边栏分类管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理首页侧边栏的分类区块，可自由增删改名称和排序</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/sidebar-nav" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
              管理导航项
            </Link>
            <button onClick={openNew} className="btn-hard text-wiki-text text-sm">
              + 新增分类
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
            {sections.length === 0 ? (
              <div className="p-12 text-center text-wiki-text-muted">暂无分类，点击上方按钮新增</div>
            ) : (
              <table className="w-full">
                <thead className="bg-wiki-gray">
                  <tr>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">分类名称</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">标识符 (Slug)</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">排序值</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">状态</th>
                    <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map(section => (
                    <tr key={section.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                      <td className="px-6 py-4 font-bold text-wiki-text">{section.name}</td>
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
                          {section.isActive ? '显示中' : '已隐藏'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(section)}
                            className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded border border-wiki-accent/40 hover:bg-wiki-accent/30"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(section)}
                            className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-xs font-bold rounded border border-wiki-danger/40 hover:bg-wiki-danger/30"
                          >
                            删除
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
          <p className="font-bold text-wiki-text mb-1">💡 使用说明</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>分类决定侧边栏显示哪些区块（如"新手快速入口"、"快捷功能"）</li>
            <li>标识符 (Slug) 用于关联导航项，创建后建议不要修改</li>
            <li>在"管理导航项"中，为每个导航项指定所属分类</li>
            <li>排序值越大越靠前</li>
          </ul>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-heading font-bold text-wiki-accent heading-hard mb-6">
              {editingSection ? '编辑分类' : '新增分类'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">分类名称 *</label>
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
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">标识符 (Slug) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none font-mono"
                  placeholder="如: quick-entry"
                  required
                />
                <p className="text-wiki-text-muted text-xs mt-1">仅限英文小写、数字和连字符，用于关联导航项</p>
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序值</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  placeholder="数字越大越靠前"
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
                  <span className="text-wiki-text font-bold">在侧边栏显示</span>
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
