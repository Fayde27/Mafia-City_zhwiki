'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface ItemCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: number
  _count: {
    items: number
  }
}

export default function AdminItemCategoryPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [categories, setCategories] = useState<ItemCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sortOrder: 0,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchCategories()
  }, [isAdmin, isLoaded, router])

  const fetchCategories = () => {
    fetch('/api/admin/item-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/admin/item-categories/${editingCategory.id}`
        : '/api/admin/item-categories'
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
        const data = await res.json()
        alert(data.error || '保存失敗')
      }
    } catch (err) {
      alert('網絡錯誤')
    }
  }

  const handleEdit = (category: ItemCategory) => {
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
    if (!confirm('確定要刪除這個分類嗎？該分類下的角色將失去分類關聯。')) return

    try {
      await fetch(`/api/admin/item-categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch (err) {
      alert('刪除失敗')
    }
  }

  const handleMoveUp = async (category: ItemCategory, index: number) => {
    if (index === 0) return
    const newSortOrder = categories[index - 1].sortOrder
    const prevSortOrder = category.sortOrder

    try {
      await Promise.all([
        fetch(`/api/admin/item-categories/${category.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...category, sortOrder: newSortOrder }),
        }),
        fetch(`/api/admin/item-categories/${categories[index - 1].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...categories[index - 1], sortOrder: prevSortOrder }),
        }),
      ])
      fetchCategories()
    } catch (err) {
      alert('排序更新失敗')
    }
  }

  const handleMoveDown = async (category: ItemCategory, index: number) => {
    if (index === categories.length - 1) return
    const newSortOrder = categories[index + 1].sortOrder
    const nextSortOrder = category.sortOrder

    try {
      await Promise.all([
        fetch(`/api/admin/item-categories/${category.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...category, sortOrder: newSortOrder }),
        }),
        fetch(`/api/admin/item-categories/${categories[index + 1].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...categories[index + 1], sortOrder: nextSortOrder }),
        }),
      ])
      fetchCategories()
    } catch (err) {
      alert('排序更新失敗')
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
              道具分類管理
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">管理道具圖鑑分類，新增、編輯或刪除分類</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/items" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
              道具管理
            </Link>
            <button
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })
                setShowModal(true)
              }}
              className="btn-hard text-wiki-text text-sm"
            >
              + 新增分類
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-wiki-gray">
                <tr>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">圖標</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">名稱</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">別名</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">描述</th>
                  <th className="text-left px-6 py-4 text-wiki-accent font-bold uppercase tracking-wider text-sm">道具數</th>
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
                    <td className="px-6 py-4 text-wiki-accent font-bold">{category._count.items}</td>
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
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="px-3 py-1 bg-wiki-danger/20 text-wiki-danger text-sm font-bold hover:bg-wiki-danger/30"
                        >
                          刪除
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
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-heading font-bold text-wiki-accent heading-hard mb-6">
              {editingCategory ? '編輯分類' : '新增分類'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">名稱 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">別名 (URL Slug) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">圖標 (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  placeholder="例如: ⚔️"
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
