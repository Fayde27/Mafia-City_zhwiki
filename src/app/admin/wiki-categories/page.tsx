'use client'

import { useState, useEffect, Suspense } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useSearchParams } from 'next/navigation'

interface WikiCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: number
  _count: {
    characters?: number
    buildings?: number
    equipment?: number
    items?: number
    troops?: number
  }
}

const wikiTypes = [
  { key: 'characters', label: '角色图鉴', model: 'characterCategory' },
  { key: 'buildings', label: '建筑图鉴', model: 'buildingCategory' },
  { key: 'equipment', label: '装备图鉴', model: 'equipmentCategory' },
  { key: 'items', label: '道具图鉴', model: 'itemCategory' },
  { key: 'troops', label: '兵种图鉴', model: 'troopCategory' },
]

function AdminWikiCategoriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [categories, setCategories] = useState<WikiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WikiCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sortOrder: 0,
  })

  const selectedType = searchParams.get('type') || 'characters'

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchCategories()
  }, [isAdmin, isLoaded, router, selectedType])

  const fetchCategories = () => {
    fetch(`/api/admin/wiki-categories?type=${selectedType}`)
      .then(res => res.json())
      .then(data => {
        setCategories(data)
        setLoading(false)
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/admin/wiki-categories/${editingCategory.id}?type=${selectedType}`
        : `/api/admin/wiki-categories?type=${selectedType}`
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        fetchCategories()
        setShowModal(false)
        setEditingCategory(null)
        setFormData({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })
      } else {
        alert('保存失败')
      }
    } catch (err) {
      alert('网络错误')
    }
  }

  const handleEdit = (category: WikiCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      sortOrder: category.sortOrder,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？')) return

    try {
      const res = await fetch(`/api/admin/wiki-categories/${id}?type=${selectedType}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        fetchCategories()
      }
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleMoveUp = async (category: WikiCategory, index: number) => {
    if (index === 0) return
    const newSortOrder = categories[index - 1].sortOrder
    const prevSortOrder = category.sortOrder

    try {
      await Promise.all([
        fetch(`/api/admin/wiki-categories/${category.id}?type=${selectedType}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...category, sortOrder: newSortOrder }),
        }),
        fetch(`/api/admin/wiki-categories/${categories[index - 1].id}?type=${selectedType}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...categories[index - 1], sortOrder: prevSortOrder }),
        }),
      ])
      fetchCategories()
    } catch (err) {
      alert('排序更新失败')
    }
  }

  const handleMoveDown = async (category: WikiCategory, index: number) => {
    if (index === categories.length - 1) return
    const newSortOrder = categories[index + 1].sortOrder
    const nextSortOrder = category.sortOrder

    try {
      await Promise.all([
        fetch(`/api/admin/wiki-categories/${category.id}?type=${selectedType}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...category, sortOrder: newSortOrder }),
        }),
        fetch(`/api/admin/wiki-categories/${categories[index + 1].id}?type=${selectedType}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...categories[index + 1], sortOrder: nextSortOrder }),
        }),
      ])
      fetchCategories()
    } catch (err) {
      alert('排序更新失败')
    }
  }

  const getCountLabel = (category: WikiCategory) => {
    switch (selectedType) {
      case 'characters': return category._count?.characters || 0
      case 'buildings': return category._count?.buildings || 0
      case 'equipment': return category._count?.equipment || 0
      case 'items': return category._count?.items || 0
      case 'troops': return category._count?.troops || 0
      default: return 0
    }
  }

  const getCountUnit = () => {
    switch (selectedType) {
      case 'characters': return '名'
      case 'buildings': return '座'
      case 'equipment': return '件'
      case 'items': return '个'
      case 'troops': return '种'
      default: return ''
    }
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              图鉴分类管理
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理各图鉴类型的分类</p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null)
              setFormData({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })
              setShowModal(true)
            }}
            className="btn-hard text-wiki-text text-sm"
          >
            + 新增分类
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {wikiTypes.map(tab => (
            <Link
              key={tab.key}
              href={`/admin/wiki-categories?type=${tab.key}`}
              className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors ${
                selectedType === tab.key
                  ? 'bg-wiki-accent/20 border-wiki-accent text-wiki-accent'
                  : 'bg-wiki-gray border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-wiki-gray">
                <tr>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">图标</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">名称</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">别名</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">描述</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">数量</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">排序</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-wiki-border hover:bg-wiki-gray/50">
                    <td className="px-6 py-4 text-2xl">{category.icon}</td>
                    <td className="px-6 py-4 text-wiki-text font-bold">{category.name}</td>
                    <td className="px-6 py-4 text-wiki-text-muted font-mono text-sm">{category.slug}</td>
                    <td className="px-6 py-4 text-wiki-text-muted text-sm max-w-xs truncate">{category.description}</td>
                    <td className="px-6 py-4 text-wiki-accent font-bold">{getCountLabel(category)} {getCountUnit()}</td>
                    <td className="px-6 py-4 text-wiki-text-muted">{category.sortOrder}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleMoveUp(category, categories.indexOf(category))}
                          disabled={categories.indexOf(category) === 0}
                          className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="上移"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(category, categories.indexOf(category))}
                          disabled={categories.indexOf(category) === categories.length - 1}
                          className="px-2 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="下移"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          className="px-3 py-1 bg-wiki-accent/20 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-heading font-bold text-wiki-accent heading-hard mb-6">
              {editingCategory ? '编辑分类' : '新增分类'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">别名 (URL Slug) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
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
                  placeholder="例如: 👤"
                />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-20"
                />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-hard text-wiki-text">保存</button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider"
                >
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

export default function AdminWikiCategoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">加载中...</div>}>
      <AdminWikiCategoriesContent />
    </Suspense>
  )
}
