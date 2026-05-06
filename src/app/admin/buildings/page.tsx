'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Building {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  rarity: number
  type: string
  function: string
  isPublished: boolean
  sortOrder: number
  category: {
    name: string
    slug: string
  }
}

export default function AdminBuildingsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchData()
  }, [isAdmin, isLoaded, router])

  const fetchData = () => {
    Promise.all([
      fetch('/api/admin/buildings').then(res => res.json()),
      fetch('/api/admin/building-categories').then(res => res.json()),
    ]).then(([buildingData, catData]) => {
      setBuildings(buildingData?.buildings || [])
      setCategories(Array.isArray(catData) ? catData : [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个建筑吗？')) return

    try {
      await fetch(`/api/admin/buildings/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleTogglePublish = async (building: Building) => {
    try {
      await fetch(`/api/admin/buildings/${building.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...building, isPublished: !building.isPublished }),
      })
      fetchData()
    } catch (err) {
      alert('更新失败')
    }
  }

  const filteredBuildings = filterCategory === 'all'
    ? buildings
    : buildings.filter(b => b.category.slug === filterCategory)

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity) + '☆'.repeat(5 - rarity)
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-white">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#e8c547] heading-hard">
              建筑管理
            </h1>
            <p className="text-gray-900-muted text-sm mt-1">管理建筑图鉴内容，新增、编辑或删除建筑</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/building-filters" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              筛选管理
            </Link>
            <Link href="/admin/building-categories" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              分类管理
            </Link>
            <Link href="/admin/buildings/new" className="btn-hard text-gray-900 text-sm">
              + 新增建筑
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-wiki-accent text-wiki-darker'
                : 'bg-gray-100 text-gray-900-muted hover:text-gray-900'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.slug)}
              className={`px-4 py-2 text-sm font-bold whitespace-nowrap ${
                filterCategory === cat.slug
                  ? 'bg-wiki-accent text-wiki-darker'
                  : 'bg-gray-100 text-gray-900-muted hover:text-gray-900'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-900-muted">加载中...</div>
        ) : filteredBuildings.length === 0 ? (
          <div className="card-hard rounded-lg p-8 md:p-12 text-center text-gray-900-muted">
            暂无建筑数据
          </div>
        ) : (
          <div className="card-hard rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">建筑</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">稀有度</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">类型</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">功能</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">分类</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">状态</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuildings.map((building) => (
                  <tr key={building.id} className="border-t border-gray-200 hover:bg-gray-100/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {building.icon ? (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xl">
                            {building.icon}
                          </div>
                        ) : building.image ? (
                          <img src={building.image} alt={building.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-900-muted">
                            {building.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-gray-900 font-bold">{building.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-yellow-400 text-sm">{getRarityStars(building.rarity)}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{building.type || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{building.function || '-'}</td>
                    <td className="px-6 py-4 text-gray-900-muted text-sm">{building.category.name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(building)}
                        className={`px-2 py-1 text-xs font-bold ${
                          building.isPublished
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-wiki-danger/20 text-wiki-danger'
                        }`}
                      >
                        {building.isPublished ? '已发布' : '草稿'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/buildings/edit/${building.id}`}
                          className="px-3 py-1 bg-wiki-accent/20 text-[#e8c547] text-sm font-bold hover:bg-wiki-accent/30"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(building.id)}
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

      <WikiFooter />
    </div>
  )
}
