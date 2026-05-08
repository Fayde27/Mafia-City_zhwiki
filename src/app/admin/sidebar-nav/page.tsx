'use client'

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
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export default function AdminSidebarNavPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [items, setItems] = useState<SidebarNavItem[]>([])
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
    fetch('/api/admin/sidebar-nav')
      .then(res => res.json())
      .then(data => {
        setItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个导航项吗？')) return

    try {
      const res = await fetch(`/api/admin/sidebar-nav/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchItems()
      } else {
        alert('删除失败')
      }
    } catch (err) {
      alert('网络错误')
    }
  }

  const handleToggleActive = async (item: SidebarNavItem) => {
    try {
      const res = await fetch(`/api/admin/sidebar-nav/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive,
        }),
      })
      if (res.ok) {
        fetchItems()
      }
    } catch (err) {
      alert('操作失败')
    }
  }

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'quick-entry': return '新手快速入口'
      case 'shortcut': return '快捷功能'
      default: return section
    }
  }

  const filteredItems = filterSection === 'all'
    ? items
    : items.filter(item => item.section === filterSection)

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = []
    }
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, SidebarNavItem[]>)

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              侧边栏导航管理
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理首页侧边栏的导航项，可自主选择在边栏展示的内容</p>
          </div>
          <Link href="/admin/sidebar-nav/new" className="btn-hard text-wiki-text text-sm">
            + 新增导航项
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: '全部' },
            { value: 'quick-entry', label: '新手快速入口' },
            { value: 'shortcut', label: '快捷功能' },
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
                <div className="px-6 py-4 border-b border-wiki-border bg-wiki-gray">
                  <h2 className="text-lg font-bold text-wiki-text">
                    {getSectionLabel(section)}
                  </h2>
                </div>
                <div className="divide-y divide-wiki-border">
                  {sectionItems.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {item.icon && (
                          <span className="text-xl flex-shrink-0">{item.icon}</span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-wiki-text">{item.label}</span>
                            {!item.isActive && (
                              <span className="px-2 py-0.5 bg-wiki-gray text-wiki-text-muted text-xs rounded">
                                已隐藏
                              </span>
                            )}
                          </div>
                          <span className="text-wiki-text-muted text-sm truncate block">{item.href}</span>
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
                          {item.isActive ? '显示' : '隐藏'}
                        </button>
                        <Link
                          href={`/admin/sidebar-nav/${item.id}`}
                          className="px-3 py-1.5 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded border border-wiki-accent/40 hover:bg-wiki-accent/30"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 bg-wiki-danger/20 text-wiki-danger text-xs font-bold rounded border border-wiki-danger/40 hover:bg-wiki-danger/30"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
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
