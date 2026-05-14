'use client'

export const runtime = 'edge'

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
  const [newType, setNewType] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchOptions()
  }, [isAdmin, isLoaded, router])

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/admin/troop-filters')
      const data = await res.json()
      setOptions(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch { setLoading(false) }
  }

  const handleAdd = async () => {
    if (!newValue.trim() || !newType.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/troop-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType.trim(), value: newValue.trim() }),
      })
      if (res.ok) { setNewValue(''); fetchOptions() }
    } catch { alert('添加失败') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    try {
      const res = await fetch(`/api/admin/troop-filters/${id}`, { method: 'DELETE' })
      if (res.ok) fetchOptions()
    } catch { alert('删除失败') }
  }

  const handleSortChange = async (id: string, sortOrder: number) => {
    try {
      await fetch(`/api/admin/troop-filters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder }),
      })
      fetchOptions()
    } catch { alert('更新失败') }
  }

  if (!isAdmin) return null

  const existingTypes = Array.from(new Set(options.map(o => o.type))).sort()
  const groupedOptions = existingTypes.reduce((acc, type) => {
    acc[type] = options.filter(o => o.type === type).sort((a, b) => a.sortOrder - b.sortOrder)
    return acc
  }, {} as Record<string, FilterOption[]>)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">兵种筛选选项管理</h1>
            <p className="text-wiki-text-muted text-sm mt-1">自由配置筛选大类和选项值，大类名称即为前台显示的标题</p>
          </div>
          <Link href="/admin/troops" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
            返回兵种管理
          </Link>
        </div>

        <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-wiki-accent mb-4">添加筛选选项</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-shrink-0">
              <label className="block text-wiki-text-muted text-xs mb-1">筛选大类</label>
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                list="type-suggestions"
                className="w-40 bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none"
                placeholder="如：稀有度"
              />
              <datalist id="type-suggestions">
                {existingTypes.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div className="flex-1">
              <label className="block text-wiki-text-muted text-xs mb-1">选项值</label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full bg-wiki-gray border-2 border-wiki-border px-3 py-2 text-wiki-text focus:border-wiki-accent focus:outline-none"
                placeholder="如：★★★★★ 或 输出"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || !newValue.trim() || !newType.trim()}
              className="btn-hard text-wiki-text disabled:opacity-50 px-6 py-2"
            >
              添加
            </button>
          </div>
          <p className="text-wiki-text-muted text-xs mt-2">筛选大类可自由命名，相同大类名称的选项会归为同一组显示。</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">加载中...</div>
        ) : existingTypes.length === 0 ? (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 text-center text-wiki-text-muted">
            暂无筛选选项，在上方添加第一个选项
          </div>
        ) : (
          <div className="space-y-6">
            {existingTypes.map(type => (
              <div key={type} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-wiki-accent mb-4">{type}</h3>
                <div className="space-y-2">
                  {groupedOptions[type].map(opt => (
                    <div key={opt.id} className="flex items-center gap-4 bg-wiki-gray rounded-lg p-3">
                      <input
                        type="number"
                        value={opt.sortOrder}
                        onChange={(e) => handleSortChange(opt.id, parseInt(e.target.value) || 0)}
                        className="w-16 bg-wiki-carder border border-wiki-border px-2 py-1 text-wiki-text text-center"
                      />
                      <span className="text-wiki-text flex-1">{opt.value}</span>
                      <button onClick={() => handleDelete(opt.id)} className="text-wiki-danger text-sm hover:opacity-70">删除</button>
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
