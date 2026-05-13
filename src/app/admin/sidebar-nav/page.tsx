'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

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

export default function AdminSidebarNavPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [items, setItems] = useState<SidebarNavItem[]>([])
  const [sections, setSections] = useState<{ id: string; name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSection, setFilterSection] = useState<string>('all')

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchItems()
  }, [isAdmin, isLoaded, router])

  const fetchItems = () => {
    Promise.all([
      fetch('/api/admin/sidebar-nav').then(res => res.json()),
      fetch('/api/admin/sidebar-sections').then(res => res.json()),
    ]).then(([navData, sectData]) => {
      setItems(Array.isArray(navData) ? navData : [])
      setSections(Array.isArray(sectData) ? sectData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const handleDelete = async (id: string, hasChildren: boolean) => {
    const msg = hasChildren
      ? '此项有子菜单，删除后子菜单将失去父级关联。确定要删除吗？'
      : '确定要删除这个导航项吗？'
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/admin/sidebar-nav/${id}`, { method: 'DELETE' })
      if (res.ok) fetchItems()
      else alert('删除失败')
    } catch { alert('网络错误') }
  }

  const handleToggleActive = async (item: SidebarNavItem) => {
    try {
      const res = await fetch(`/api/admin/sidebar-nav/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: !item.isActive }),
      })
      if (res.ok) fetchItems()
    } catch { alert('操作失败') }
  }

  const getSectionLabel = (slug: string) => {
    return sections.find(s => s.slug === slug)?.name || slug
  }

  const filteredItems = filterSection === 'all'
    ? items
    : items.filter(item => item.section === filterSection)

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, SidebarNavItem[]>)

  const renderItem = (item: SidebarNavItem, isChild = false) => (
    <div key={item.id}>
      <div className={`px-6 py-4 flex items-center justify-between ${isChild ? 'bg-wiki-gray/30 pl-12 border-l-4 border-wiki-accent/30' : ''}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {isChild && <span className="text-wiki-text-muted text-xs">└</span>}
          {item.icon && <span className="text-xl flex-shrink-0">{item.icon}</span>}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-wiki-text">{item.label}</span>
              {(item.children?.length ?? 0) > 0 && (
                <span className="px-2 py-0.5 bg-wiki-accent/20 text-wiki-accent text-xs rounded">
                  {item.children!.length} 个子菜单
                </span>
              )}
              {!item.isActive && (
                <span className="px-2 py-0.5 bg-wiki-gray text-wiki-text-muted text-xs rounded">已隐藏</span>
              )}
            </div>
            <span className="text-wiki-text-muted text-sm truncate block">
              {item.href || <em className="opacity-50">无链接（展开父级）</em>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleToggleActive(item)}
            className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
              item.isActive
                ? 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30'
                : 'bg-wiki-gray text-wiki-text-muted border-wiki-border hover:border-wiki-accent/50'
            }`}
          >
            {item.isActive ? '显示中' : '已隐藏'}
          </button>
          <Link
            href={`/admin/sidebar-nav/${item.id}`}
            className="px-3 py-1.5 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded border border-wiki-accent/40 hover:bg-wiki-accent/30"
          >
            编辑
          </Link>
          <button
            onClick={() => handleDelete(item.id, (item.children?.length ?? 0) > 0)}
            className="px-3 py-1.5 bg-wiki-danger/20 text-wiki-danger text-xs font-bold rounded border border-wiki-danger/40 hover:bg-wiki-danger/30"
          >
            删除
          </button>
        </div>
      </div>
      {/* 子项 */}
      {item.children && item.children.length > 0 && (
        <div className="divide-y divide-wiki-border/50">
          {item.children.map(child => renderItem(child, true))}
        </div>
      )}
    </div>
  )

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">侧边栏导航管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">支持多级菜单，父级可展开显示子菜单</p>
          </div>
          <Link href="/admin/sidebar-nav/new" className="btn-hard text-wiki-text text-sm">
            + 新增导航项
          </Link>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: 'all', label: '全部' },
            ...sections.map(s => ({ value: s.slug, label: s.name })),
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterSection(tab.value)}
              className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${
                filterSection === tab.value
                  ? 'bg-wiki-accent/20 border-wiki-accent text-wiki-accent'
                  : 'bg-wiki-gray border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : items.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-12 text-center text-wiki-text-muted">
            暂无导航项，点击上方按钮新增
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([section, sectionItems]) => (
              <div key={section} className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-wiki-border bg-wiki-gray flex items-center justify-between">
                  <h2 className="text-lg font-bold text-wiki-text">{getSectionLabel(section)}</h2>
                  <span className="text-wiki-text-muted text-xs">{sectionItems.length} 个顶级项</span>
                </div>
                <div className="divide-y divide-wiki-border">
                  {sectionItems.map(item => renderItem(item))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
