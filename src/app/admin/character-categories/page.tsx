'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface CharacterCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: number
  _count: {
    characters: number
  }
}

export default function AdminCharacterCategoriesPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [categories, setCategories] = useState<CharacterCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CharacterCategory | null>(null)
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
    fetch('/api/admin/character-categories')
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
        ? `/api/admin/character-categories/${editingCategory.id}`
        : '/api/admin/character-categories'
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
        alert(data.error || '保存失败')
      }
    } catch (err) {
      alert('网络错误')
    }
  }

  const handleEdit = (category: CharacterCategory) => {
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
    if (!confirm('确定要删除这个分类吗？该分类下的角色将失去分类关联。')) return

    try {
      await fetch(`/api/admin/character-categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleMoveUp = async (category: CharacterCategory, index: number) => {
    if (index === 0) return
    const newSortOrder = categories[index - 1].sortOrder
    const prevSortOrder = category.sortOrder

    try {
      await Promise.all([
        fetch(`/api/admin/character-categories/${category.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...category, sortOrder: newSortOrder }),
        }),
        fetch(`/api/admin/character-categories/${categories[index - 1].id}`, {
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

  const handleMoveDown = async (category: CharacterCategory, index: number) => {
    if (index === categories.length - 1) return
    const newSortOrder = categories[index + 1].sortOrder
    const nextSortOrder = category.sortOrder

    try {
      await Promise.all([
        fetch(`/api/admin/character-categories/${category.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...category, sortOrder: newSortOrder }),
        }),
        fetch(`/api/admin/character-categories/${categories[index + 1].id}`, {
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

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-white">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#e8c547] heading-hard">
              角色分类管理
            </h1>
            <p className="text-gray-900-muted text-sm mt-1">管理角色图鉴分类，新增、编辑或删除分类</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/characters" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              角色管理
            </Link>
            <button
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', slug: '', description: '', icon: '', sortOrder: 0 })
                setShowModal(true)
              }}
              className="btn-hard text-gray-900 text-sm"
            >
              + 新增分类
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-900-muted">加载中...</div>
        ) : (
          <div className="card-hard rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">图标</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">名称</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">别名</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">描述</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">角色数</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">排序</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-gray-200 hover:bg-gray-100/50">
                    <td className="px-6 py-4 text-2xl">{category.icon}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold">{category.name}</td>
                    <td className="px-6 py-4 text-gray-900-muted font-mono text-sm">{category.slug}</td>
                    <td className="px-6 py-4 text-gray-900-muted text-sm max-w-xs truncate">{category.description}</td>
                    <td className="px-6 py-4 text-[#e8c547] font-bold">{category._count.characters}</td>
                    <td className="px-6 py-4 text-gray-900-muted">{category.sortOrder}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleMoveUp(category, categories.indexOf(category))}
                          disabled={categories.indexOf(category) === 0}
                          className="px-2 py-1 bg-wiki-accent/20 text-[#e8c547] text-sm font-bold hover:bg-wiki-accent/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="上移"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(category, categories.indexOf(category))}
                          disabled={categories.indexOf(category) === categories.length - 1}
                          className="px-2 py-1 bg-wiki-accent/20 text-[#e8c547] text-sm font-bold hover:bg-wiki-accent/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="下移"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          className="px-3 py-1 bg-wiki-accent/20 text-[#e8c547] text-sm font-bold hover:bg-wiki-accent/30"
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
          <div className="card-hard rounded-lg p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-heading font-bold text-[#e8c547] heading-hard mb-6">
              {editingCategory ? '编辑分类' : '新增分类'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">别名 (URL Slug) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">图标 (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
                  placeholder="例如: ⚔️"
                />
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none h-20"
                />
              </div>
              <div>
                <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">排序</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-hard text-gray-900">保存</button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-900 font-bold uppercase tracking-wider"
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
