'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DraftItem {
  id: string
  name?: string
  title?: string
  slug: string
  createdAt: string
  updatedAt: string
  category?: { name: string } | null
  Category?: { name: string } | null
  CharacterCategory?: { name: string } | null
  BuildingCategory?: { name: string } | null
  EquipmentCategory?: { name: string } | null
  ItemCategory?: { name: string } | null
  TroopCategory?: { name: string } | null
}

const TYPES = [
  {
    key: 'articles',
    label: '文章',
    api: '/api/admin/articles?draft=true&limit=100',
    dataKey: 'articles',
    nameKey: 'title',
    editPath: (id: string) => `/admin/articles/edit/${id}`,
    publishApi: (id: string) => `/api/admin/articles/${id}`,
    publishBody: (item: DraftItem) => ({ isPublished: true }),
    categoryKey: 'Category',
  },
  {
    key: 'items',
    label: '道具',
    api: '/api/admin/items?draft=true&limit=100',
    dataKey: 'items',
    nameKey: 'name',
    editPath: (id: string) => `/admin/items/edit/${id}`,
    publishApi: (id: string) => `/api/admin/items/${id}`,
    publishBody: (item: DraftItem) => ({ isPublished: true }),
    categoryKey: 'ItemCategory',
  },
]

export default function DraftsPage() {
  const { isAdmin, isLoaded } = useAdminAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('articles')
  const [data, setData] = useState<Record<string, DraftItem[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [publishing, setPublishing] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && !isAdmin) router.push('/admin/login')
  }, [isAdmin, isLoaded, router])

  useEffect(() => {
    if (!isAdmin) return
    TYPES.forEach(type => {
      setLoading(prev => ({ ...prev, [type.key]: true }))
      fetch(type.api)
        .then(r => r.json())
        .then(res => {
          setData(prev => ({ ...prev, [type.key]: res[type.dataKey] || [] }))
        })
        .catch(() => setData(prev => ({ ...prev, [type.key]: [] })))
        .finally(() => setLoading(prev => ({ ...prev, [type.key]: false })))
    })
  }, [isAdmin])

  const handlePublish = async (type: typeof TYPES[0], item: DraftItem) => {
    const key = `${type.key}-${item.id}`
    setPublishing(key)
    try {
      const res = await fetch(type.publishApi(item.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isPublished: true }),
      })
      if (res.ok) {
        setData(prev => ({
          ...prev,
          [type.key]: (prev[type.key] || []).filter(i => i.id !== item.id),
        }))
      } else {
        alert('發布失敗，請重試')
      }
    } finally {
      setPublishing(null)
    }
  }

  if (!isLoaded) return null

  const activeType = TYPES.find(t => t.key === activeTab)!
  const activeItems = data[activeTab] || []
  const isLoadingActive = loading[activeTab]

  const totalDrafts = TYPES.reduce((acc, t) => acc + (data[t.key]?.length || 0), 0)

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-wiki-text">
              <span className="text-wiki-accent mr-2">◆</span>草稿箱
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">
              共 <span className="text-wiki-accent font-bold">{totalDrafts}</span> 筆未發布內容
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors"
          >
            ← 返回後台
          </button>
        </div>

        {/* 分頁標籤 */}
        <div className="flex gap-2 mb-6 flex-wrap border-b border-wiki-border pb-3">
          {TYPES.map(type => {
            const count = data[type.key]?.length || 0
            return (
              <button
                key={type.key}
                onClick={() => setActiveTab(type.key)}
                className={`px-4 py-2 text-sm rounded-t font-bold transition-colors relative ${
                  activeTab === type.key
                    ? 'text-wiki-accent border-b-2 border-wiki-accent bg-wiki-accent/5'
                    : 'text-wiki-text-muted hover:text-wiki-text'
                }`}
              >
                {type.label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-wiki-danger text-white text-xs rounded-full">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 草稿列表 */}
        {isLoadingActive ? (
          <div className="text-center py-16 text-wiki-text-muted">載入中...</div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-16 text-wiki-text-muted">
            <p className="text-4xl mb-3">✓</p>
            <p>目前沒有 {activeType.label} 草稿</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeItems.map(item => {
              const name = (item as any)[activeType.nameKey] || '(無標題)'
              const categoryObj = (item as any)[activeType.categoryKey]
              const categoryName = categoryObj?.name || ''
              const pubKey = `${activeType.key}-${item.id}`
              const isPublishing = publishing === pubKey

              return (
                <div
                  key={item.id}
                  className="bg-wiki-card border border-wiki-border rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {categoryName && (
                        <span className="text-wiki-accent text-xs font-bold">{categoryName}</span>
                      )}
                      <span className="px-2 py-0.5 bg-wiki-gray text-wiki-text-muted text-xs rounded border border-wiki-border">
                        草稿
                      </span>
                    </div>
                    <p className="text-wiki-text font-bold text-sm line-clamp-1">{name}</p>
                    <p className="text-wiki-text-muted text-xs mt-0.5">
                      更新於 {new Date(item.updatedAt || item.createdAt).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={activeType.editPath(item.id)}
                      className="px-3 py-1.5 bg-wiki-gray border border-wiki-border text-wiki-text-secondary text-xs font-bold rounded-lg hover:text-wiki-accent hover:border-wiki-accent transition-colors"
                    >
                      編輯
                    </Link>
                    <button
                      onClick={() => handlePublish(activeType, item)}
                      disabled={isPublishing}
                      className="px-3 py-1.5 bg-wiki-accent text-wiki-dark text-xs font-bold rounded-lg hover:bg-wiki-accent/90 disabled:opacity-50 transition-colors"
                    >
                      {isPublishing ? '發布中...' : '一鍵發布'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
