'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Troop {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  rarity: number
  type: string
  attack: number
  defense: number
  hp: number
  speed: number
  isPublished: boolean
  sortOrder: number
  category: {
    name: string
    slug: string
  }
}

export default function AdminTroopsPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [troops, setTroops] = useState<Troop[]>([])
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
      fetch('/api/admin/troops').then(res => res.json()),
      fetch('/api/admin/troop-categories').then(res => res.json()),
    ]).then(([troopData, catData]) => {
      setTroops(troopData?.troops || [])
      setCategories(Array.isArray(catData) ? catData : [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个兵种吗？')) return

    try {
      await fetch(`/api/admin/troops/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleTogglePublish = async (troop: Troop) => {
    try {
      await fetch(`/api/admin/troops/${troop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...troop, isPublished: !troop.isPublished }),
      })
      fetchData()
    } catch (err) {
      alert('更新失败')
    }
  }

  const filteredTroops = filterCategory === 'all'
    ? troops
    : troops.filter(t => t.category.slug === filterCategory)

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
              兵种管理
            </h1>
            <p className="text-gray-900-muted text-sm mt-1">管理兵种图鉴内容，新增、编辑或删除兵种</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/troop-filters" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              筛选管理
            </Link>
            <Link href="/admin/troop-categories" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              分类管理
            </Link>
            <Link href="/admin/troops/new" className="btn-hard text-gray-900 text-sm">
              + 新增兵种
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
        ) : filteredTroops.length === 0 ? (
          <div className="card-hard rounded-lg p-8 md:p-12 text-center text-gray-900-muted">
            暂无兵种数据
          </div>
        ) : (
          <div className="card-hard rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">兵种</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">稀有度</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">类型</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">属性</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">分类</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">状态</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTroops.map((troop) => (
                  <tr key={troop.id} className="border-t border-gray-200 hover:bg-gray-100/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {troop.icon ? (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xl">
                            {troop.icon}
                          </div>
                        ) : troop.image ? (
                          <img src={troop.image} alt={troop.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-900-muted">
                            {troop.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-gray-900 font-bold">{troop.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-yellow-400 text-sm">{getRarityStars(troop.rarity)}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{troop.type || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">
                      攻{troop.attack} 防{troop.defense} 血{troop.hp}
                    </td>
                    <td className="px-6 py-4 text-gray-900-muted text-sm">{troop.category.name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(troop)}
                        className={`px-2 py-1 text-xs font-bold ${
                          troop.isPublished
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-wiki-danger/20 text-wiki-danger'
                        }`}
                      >
                        {troop.isPublished ? '已发布' : '草稿'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/troops/edit/${troop.id}`}
                          className="px-3 py-1 bg-wiki-accent/20 text-[#e8c547] text-sm font-bold hover:bg-wiki-accent/30"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(troop.id)}
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
