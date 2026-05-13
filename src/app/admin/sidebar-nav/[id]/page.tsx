'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface SidebarNavItem {
  id: string
  section: string
  label: string
  icon: string | null
  href: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
  children?: SidebarNavItem[]
}

export default function EditSidebarNavPage() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, isLoaded } = useAdminAuth()
  const itemId = params?.id as string
  const isNew = !itemId || itemId === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [allTopItems, setAllTopItems] = useState<SidebarNavItem[]>([])
  const [formData, setFormData] = useState({
    section: 'quick-entry',
    label: '',
    icon: '',
    href: '',
    parentId: '',
    sortOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    // 加载所有顶级项（用于父级选择器）
    fetch('/api/admin/sidebar-nav')
      .then(res => res.json())
      .then(data => {
        // data 已是嵌套结构，顶级项用于父级选择
        setAllTopItems(Array.isArray(data) ? data : [])
      })

    if (!isNew && itemId) {
      fetch(`/api/admin/sidebar-nav/${itemId}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            section: data.section,
            label: data.label,
            icon: data.icon || '',
            href: data.href || '',
            parentId: data.parentId || '',
            sortOrder: data.sortOrder,
            isActive: data.isActive,
          })
          setLoading(false)
        })
    }
  }, [itemId, isNew, isAdmin, isLoaded, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = isNew ? '/api/admin/sidebar-nav' : `/api/admin/sidebar-nav/${itemId}`
      const method = isNew ? 'POST' : 'PUT'
      const body = {
        ...formData,
        parentId: formData.parentId || null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.push('/admin/sidebar-nav')
      } else {
        alert('保存失败')
      }
    } catch { alert('网络错误') }
    finally { setSaving(false) }
  }

  // 可选作为父级的项（不含自身，不含已是子项的）
  const parentOptions = allTopItems.filter(item => item.id !== itemId)

  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-wiki-text-muted text-xl">加载中...</div>
        </div>
        <WikiFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              {isNew ? '新增导航项' : '编辑导航项'}
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">设置侧边栏导航的显示内容和跳转链接</p>
          </div>
          <Link href="/admin/sidebar-nav" className="text-wiki-text-muted hover:text-wiki-accent text-sm">
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 space-y-6">

          {/* 父级菜单（如选择父级，则变为子菜单） */}
          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">父级菜单</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
            >
              <option value="">无（顶级菜单）</option>
              {parentOptions.map(item => (
                <option key={item.id} value={item.id}>
                  {item.icon ? `${item.icon} ` : ''}{item.label} ({item.section === 'quick-entry' ? '新手快速入口' : '快捷功能'})
                </option>
              ))}
            </select>
            {formData.parentId && (
              <p className="text-wiki-text-muted text-xs mt-1">此项将作为子菜单显示在父级下方，点击父级可展开</p>
            )}
          </div>

          {/* 所属分组（选了父级时沿用父级分组，可不改） */}
          {!formData.parentId && (
            <div>
              <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">所属分组 *</label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                required
              >
                <option value="quick-entry">新手快速入口</option>
                <option value="shortcut">快捷功能</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">显示名称 *</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="例如: 图鉴、角色图鉴"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">图标 (Emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="例如: 📚、👤、🏠"
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              跳转链接 {formData.parentId ? '' : '*'}
            </label>
            <input
              type="text"
              value={formData.href}
              onChange={(e) => setFormData({ ...formData, href: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder={formData.parentId ? '子菜单链接（可留空仅展示）' : '例如: /wiki、/wiki/guides'}
              required={!formData.parentId}
            />
            {!formData.parentId && (
              <p className="text-wiki-text-muted text-xs mt-1">顶级菜单若有子菜单，链接可留空（点击展开子菜单）</p>
            )}
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序权重</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="数字越大越靠前"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-wiki-text font-bold">在侧边栏显示</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-hard text-wiki-text" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </button>
            <Link href="/admin/sidebar-nav" className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
              取消
            </Link>
          </div>
        </form>
      </main>

      <WikiFooter />
    </div>
  )
}
