'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface FilterOption {
  id: string
  type: string
  value: string
  sortOrder: number
}

export default function AdminTroopFiltersPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [options, setOptions] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newType, setNewType] = useState('rarity')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchOptions()
  }, [isAdmin, isLoaded, router])

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/admin/troop-filters')
      const data = await res.json()
      setOptions(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newValue.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/troop-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType, value: newValue.trim() }),
      })
      if (res.ok) {
        setNewValue('')
        fetchOptions()
      }
    } catch {
      alert('添加失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    try {
      const res = await fetch(`/api/admin/troop-filters/${id}`, { method: 'DELETE' })
      if (res.ok) fetchOptions()
    } catch {
      alert('删除失败')
    }
  }

  const handleSortChange = async (id: string, sortOrder: number) => {
    try {
      await fetch(`/api/admin/troop-filters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder }),
      })
      fetchOptions()
    } catch {
      alert('更新失败')
    }
  }

  if (!isAdmin) return null

  const rarityOptions = options.filter(o => o.type === 'rarity')
  const typeOptions = options.filter(o => o.type === 'type')

  return (
    <div className="min-h-screen bg-white">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#e8c547] heading-hard">兵种筛选选项管理</h1>
            <p className="text-gray-900-muted text-sm mt-1">管理兵种图鉴筛选菜单的选项</p>
          </div>
          <Link href="/admin/troops" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
            返回兵种管理
          </Link>
        </div>

        <div className="card-hard rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-[#e8c547] mb-4">添加选项</h3>
          <div className="flex gap-4">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none cursor-pointer"
            >
              <option value="rarity">稀有度</option>
              <option value="type">兵种类型</option>
            </select>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
              placeholder="输入选项值"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newValue.trim()}
              className="btn-hard text-gray-900 disabled:opacity-50 px-6"
            >
              添加
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-900-muted">加载中...</div>
        ) : (
          <div className="space-y-6">
            <div className="card-hard rounded-lg p-6">
              <h3 className="text-lg font-bold text-[#e8c547] mb-4">稀有度</h3>
              {rarityOptions.length === 0 ? (
                <p className="text-gray-900-muted text-sm">暂无选项</p>
              ) : (
                <div className="space-y-2">
                  {rarityOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-4 bg-gray-100 rounded-lg p-3">
                      <input
                        type="number"
                        value={opt.sortOrder}
                        onChange={(e) => handleSortChange(opt.id, parseInt(e.target.value))}
                        className="w-16 bg-whiteer border border-gray-200 px-2 py-1 text-gray-900 text-center"
                      />
                      <span className="text-gray-900 flex-1">{'★'.repeat(parseInt(opt.value)) + '☆'.repeat(5 - parseInt(opt.value))}</span>
                      <span className="text-gray-900-muted text-sm">{opt.value}星</span>
                      <button onClick={() => handleDelete(opt.id)} className="text-red-500 hover:text-red-300 text-sm">删除</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-hard rounded-lg p-6">
              <h3 className="text-lg font-bold text-[#e8c547] mb-4">兵种类型</h3>
              {typeOptions.length === 0 ? (
                <p className="text-gray-900-muted text-sm">暂无选项</p>
              ) : (
                <div className="space-y-2">
                  {typeOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-4 bg-gray-100 rounded-lg p-3">
                      <input
                        type="number"
                        value={opt.sortOrder}
                        onChange={(e) => handleSortChange(opt.id, parseInt(e.target.value))}
                        className="w-16 bg-whiteer border border-gray-200 px-2 py-1 text-gray-900 text-center"
                      />
                      <span className="text-gray-900 flex-1">{opt.value}</span>
                      <button onClick={() => handleDelete(opt.id)} className="text-red-500 hover:text-red-300 text-sm">删除</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <WikiFooter />
    </div>
  )
}
