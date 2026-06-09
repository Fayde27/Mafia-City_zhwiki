'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface Haojie {
  id: string; name: string; slug: string; avatar: string
  rarity: string; traits: string; awakenHero: boolean; isPublished: boolean; sortOrder: number
  CharacterCategory: { name: string; slug: string } | null
}

export default function AdminHaojiePage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [haojieList, setHaojieList] = useState<Haojie[]>([])

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetchAll()
  }, [isAdmin, isLoaded, router])

  const fetchAll = async () => {
    try {
      const res = await fetch('/api/admin/haojie?limit=100')
      const d = await res.json()
      setHaojieList(d?.haojie || [])
    } finally { setLoading(false) }
  }

  const handleTogglePublish = async (h: Haojie) => {
    await fetch(`/api/admin/haojie/${h.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...h, isPublished: !h.isPublished }),
    })
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個豪杰嗎？')) return
    await fetch(`/api/admin/haojie/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const rarityColor = (r: string) => r === '金' ? 'text-yellow-400' : 'text-purple-400'

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-wiki-text heading-hard">豪杰圖鑑管理</h1>
            <p className="text-wiki-text-muted mt-1">管理所有豪杰條目</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/characters" className="px-4 py-2 bg-wiki-gray border border-wiki-border text-wiki-text text-sm hover:border-wiki-accent transition-colors">
              ← 英雄圖鑑
            </Link>
            <Link href="/admin/characters/haojie/edit/new" className="px-4 py-2 bg-wiki-accent text-wiki-bg text-sm font-bold hover:opacity-90 transition-opacity">
              + 新增豪杰
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
        ) : (
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wiki-border bg-wiki-gray">
                  <th className="text-left px-4 py-3 text-wiki-text-muted font-medium">豪杰</th>
                  <th className="text-left px-4 py-3 text-wiki-text-muted font-medium">稀有度</th>
                  <th className="text-left px-4 py-3 text-wiki-text-muted font-medium">分類</th>
                  <th className="text-left px-4 py-3 text-wiki-text-muted font-medium">覺醒</th>
                  <th className="text-left px-4 py-3 text-wiki-text-muted font-medium">狀態</th>
                  <th className="text-right px-4 py-3 text-wiki-text-muted font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {haojieList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-wiki-text-muted">尚無豪杰，點擊右上角新增</td></tr>
                ) : haojieList.map(h => (
                  <tr key={h.id} className="border-b border-wiki-border/50 hover:bg-wiki-gray/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {h.avatar
                          ? <img src={h.avatar} alt={h.name} className="w-8 h-8 rounded-full object-cover border border-wiki-border" />
                          : <div className="w-8 h-8 rounded-full bg-wiki-gray border border-wiki-border flex items-center justify-center text-wiki-text-muted text-xs">?</div>}
                        <div>
                          <p className="font-medium text-wiki-text">{h.name}</p>
                          <p className="text-xs text-wiki-text-muted">{h.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${rarityColor(h.rarity)}`}>{h.rarity}</span>
                    </td>
                    <td className="px-4 py-3 text-wiki-text-muted">
                      {h.CharacterCategory?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {h.awakenHero
                        ? <span className="px-2 py-0.5 text-xs bg-wiki-accent/20 text-wiki-accent border border-wiki-accent/40 rounded">已覺醒</span>
                        : <span className="text-wiki-text-muted text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePublish(h)}
                        className={`px-2 py-0.5 text-xs border rounded transition-colors ${h.isPublished ? 'border-green-500/40 text-green-400 bg-green-900/20' : 'border-wiki-border text-wiki-text-muted'}`}>
                        {h.isPublished ? '已發布' : '草稿'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/characters/haojie/edit/${h.id}`}
                          className="px-3 py-1 text-xs bg-wiki-gray border border-wiki-border text-wiki-text hover:border-wiki-accent transition-colors">
                          編輯
                        </Link>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="px-3 py-1 text-xs bg-wiki-gray border border-wiki-border text-red-400 hover:border-red-500 transition-colors">
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
      <WikiFooter />
    </div>
  )
}
