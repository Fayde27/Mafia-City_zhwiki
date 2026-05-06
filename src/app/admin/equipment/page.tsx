'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Equipment {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  rarity: number
  type: string
  slot: string
  isPublished: boolean
  sortOrder: number
  category: {
    name: string
    slug: string
  }
}

export default function AdminEquipmentPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [equipment, setEquipment] = useState<Equipment[]>([])
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
      fetch('/api/admin/equipment').then(res => res.json()),
      fetch('/api/admin/equipment-categories').then(res => res.json()),
    ]).then(([equipData, catData]) => {
      setEquipment(equipData?.equipment || [])
      setCategories(Array.isArray(catData) ? catData : [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个装备吗？')) return

    try {
      await fetch(`/api/admin/equipment/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleTogglePublish = async (equip: Equipment) => {
    try {
      await fetch(`/api/admin/equipment/${equip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...equip, isPublished: !equip.isPublished }),
      })
      fetchData()
    } catch (err) {
      alert('更新失败')
    }
  }

  const filteredEquipment = filterCategory === 'all'
    ? equipment
    : equipment.filter(e => e.category.slug === filterCategory)

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
              装备管理
            </h1>
            <p className="text-gray-900-muted text-sm mt-1">管理装备图鉴内容，新增、编辑或删除装备</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/equipment-filters" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              筛选管理
            </Link>
            <Link href="/admin/equipment-categories" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              分类管理
            </Link>
            <Link href="/admin/equipment/new" className="btn-hard text-gray-900 text-sm">
              + 新增装备
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
        ) : filteredEquipment.length === 0 ? (
          <div className="card-hard rounded-lg p-8 md:p-12 text-center text-gray-900-muted">
            暂无装备数据
          </div>
        ) : (
          <div className="card-hard rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">装备</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">稀有度</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">类型</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">部位</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">分类</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">状态</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((equip) => (
                  <tr key={equip.id} className="border-t border-gray-200 hover:bg-gray-100/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {equip.icon ? (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xl">
                            {equip.icon}
                          </div>
                        ) : equip.image ? (
                          <img src={equip.image} alt={equip.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-900-muted">
                            {equip.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-gray-900 font-bold">{equip.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-yellow-400 text-sm">{getRarityStars(equip.rarity)}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{equip.type || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{equip.slot || '-'}</td>
                    <td className="px-6 py-4 text-gray-900-muted text-sm">{equip.category.name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(equip)}
                        className={`px-2 py-1 text-xs font-bold ${
                          equip.isPublished
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-wiki-danger/20 text-wiki-danger'
                        }`}
                      >
                        {equip.isPublished ? '已发布' : '草稿'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/equipment/edit/${equip.id}`}
                          className="px-3 py-1 bg-wiki-accent/20 text-[#e8c547] text-sm font-bold hover:bg-wiki-accent/30"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(equip.id)}
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
