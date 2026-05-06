'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Character {
  id: string
  name: string
  slug: string
  title: string
  avatar: string
  banner: string
  rarity: number
  path: string
  faction: string
  combatType: string
  isPublished: boolean
  sortOrder: number
  category: {
    name: string
    slug: string
  }
}

export default function AdminCharactersPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [characters, setCharacters] = useState<Character[]>([])
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
      fetch('/api/admin/characters').then(res => res.json()),
      fetch('/api/admin/character-categories').then(res => res.json()),
    ]).then(([charData, catData]) => {
      setCharacters(charData?.characters || [])
      setCategories(Array.isArray(catData) ? catData : [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个角色吗？')) return

    try {
      await fetch(`/api/admin/characters/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      alert('删除失败')
    }
  }

  const handleTogglePublish = async (character: Character) => {
    try {
      await fetch(`/api/admin/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...character, isPublished: !character.isPublished }),
      })
      fetchData()
    } catch (err) {
      alert('更新失败')
    }
  }

  const filteredCharacters = filterCategory === 'all'
    ? characters
    : characters.filter(c => c.category.slug === filterCategory)

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
              角色管理
            </h1>
            <p className="text-gray-900-muted text-sm mt-1">管理角色图鉴内容，新增、编辑或删除角色</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/character-filters" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              筛选管理
            </Link>
            <Link href="/admin/character-categories" className="px-4 py-2 bg-gray-100 text-gray-900 font-bold text-sm hover:text-[#e8c547]">
              分类管理
            </Link>
            <Link href="/admin/characters/new" className="btn-hard text-gray-900 text-sm">
              + 新增角色
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
        ) : filteredCharacters.length === 0 ? (
          <div className="card-hard rounded-lg p-8 md:p-12 text-center text-gray-900-muted">
            暂无角色数据
          </div>
        ) : (
          <div className="card-hard rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">角色</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">稀有度</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">命途</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">属性</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">分类</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">状态</th>
                  <th className="text-left px-6 py-4 text-[#e8c547] font-bold uppercase tracking-wider text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCharacters.map((character) => (
                  <tr key={character.id} className="border-t border-gray-200 hover:bg-gray-100/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {character.avatar ? (
                          <img src={character.avatar} alt={character.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-900-muted">
                            {character.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-gray-900 font-bold">{character.name}</div>
                          {character.title && (
                            <div className="text-gray-900-muted text-xs">{character.title}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-yellow-400 text-sm">{getRarityStars(character.rarity)}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{character.path || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{character.combatType || '-'}</td>
                    <td className="px-6 py-4 text-gray-900-muted text-sm">{character.category.name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(character)}
                        className={`px-2 py-1 text-xs font-bold ${
                          character.isPublished
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-wiki-danger/20 text-wiki-danger'
                        }`}
                      >
                        {character.isPublished ? '已发布' : '草稿'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/characters/edit/${character.id}`}
                          className="px-3 py-1 bg-wiki-accent/20 text-[#e8c547] text-sm font-bold hover:bg-wiki-accent/30"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(character.id)}
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
