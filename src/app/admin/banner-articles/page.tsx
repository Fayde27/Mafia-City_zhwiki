'use client'

export const runtime = 'edge'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  summary: string
  coverImage: string
  coverImagePosition?: string
  category: { name: string; slug: string } | null
  isPublished: boolean
  createdAt: string
}

const cardCls = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none rounded'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

const MAX_BANNER = 8

export default function BannerArticlesPage() {
  const { isAdmin, isLoaded } = useAdminAuth()
  const router = useRouter()

  // 已選中的 banner 文章（保持順序）
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([])

  // 搜索
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Article[]>([])
  const [searching, setSearching] = useState(false)
  const [searchDone, setSearchDone] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isLoaded && !isAdmin) router.push('/admin/login')
  }, [isAdmin, isLoaded, router])

  // 載入已保存的 banner 設置
  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(r => r.json())
      .then(async (config) => {
        let ids: string[] = []
        if (config.bannerArticleIds) {
          try { ids = JSON.parse(config.bannerArticleIds) } catch {}
        }
        setSelectedIds(ids)

        if (ids.length > 0) {
          // 取文章詳情
          const res = await fetch(`/api/wiki/banner-articles`)
          const articles = await res.json()
          setSelectedArticles(articles)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // 搜索文章
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchDone(false)
    try {
      const res = await fetch(`/api/admin/articles?search=${encodeURIComponent(searchQuery.trim())}&limit=20`)
      const data = await res.json()
      const articles = (data.articles || []).map((a: any) => ({
        ...a,
        category: a.Category || a.category,
      }))
      setSearchResults(articles)
      setSearchDone(true)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  // 新增到 banner 列表
  const addArticle = (article: Article) => {
    if (selectedIds.includes(article.id)) return
    if (selectedIds.length >= MAX_BANNER) {
      alert(`最多只能選 ${MAX_BANNER} 篇文章`)
      return
    }
    setSelectedIds(prev => [...prev, article.id])
    setSelectedArticles(prev => [...prev, article])
  }

  // 從 banner 列表移除
  const removeArticle = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id))
    setSelectedArticles(prev => prev.filter(a => a.id !== id))
  }

  // 上移 / 下移
  const moveArticle = (id: string, direction: 'up' | 'down') => {
    const idx = selectedIds.indexOf(id)
    if (idx < 0) return
    const newIds = [...selectedIds]
    const newArticles = [...selectedArticles]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= newIds.length) return
    ;[newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]]
    ;[newArticles[idx], newArticles[swapIdx]] = [newArticles[swapIdx], newArticles[idx]]
    setSelectedIds(newIds)
    setSelectedArticles(newArticles)
  }

  // 保存
  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerArticleIds: JSON.stringify(selectedIds) }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('保存失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">
        載入中...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 頂部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-wiki-text">
              <span className="text-wiki-accent mr-2">◆</span>首頁輪播 Banner 管理
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">
              選擇展示在首頁輪播中的文章，最多 {MAX_BANNER} 篇，可調整順序
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? '保存中...' : saved ? '✓ 已保存' : '保存設置'}
            </button>
            <Link
              href="/admin/dashboard"
              className="text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors"
            >
              ← 返回後台
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：已選文章列表 */}
          <div className={cardCls}>
            <h2 className="text-wiki-text font-bold mb-1 flex items-center gap-2">
              <span className="text-wiki-accent text-sm">◆</span>
              已選文章
              <span className="ml-auto text-wiki-text-muted text-xs font-normal">
                {selectedArticles.length} / {MAX_BANNER}
              </span>
            </h2>
            <p className="text-wiki-text-muted text-xs mb-4">拖動調整順序，左右箭頭也可以調換位置</p>

            {selectedArticles.length === 0 ? (
              <div className="text-center py-12 text-wiki-text-muted text-sm border-2 border-dashed border-wiki-border rounded-lg">
                <div className="text-3xl mb-2">🖼️</div>
                <div>尚未選擇任何文章</div>
                <div className="text-xs mt-1">從右側搜索並選擇文章</div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedArticles.map((article, idx) => (
                  <div
                    key={article.id}
                    className="flex items-center gap-3 bg-wiki-card border border-wiki-border rounded-lg p-3 group"
                  >
                    {/* 序號 */}
                    <div className="w-6 h-6 rounded-full bg-wiki-accent/20 text-wiki-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>

                    {/* 封面圖 */}
                    <div className="w-14 h-10 flex-shrink-0 rounded overflow-hidden bg-wiki-gray">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: article.coverImagePosition || '50% 50%' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-wiki-text-muted text-xs">
                          無圖
                        </div>
                      )}
                    </div>

                    {/* 標題 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-wiki-text text-sm font-bold line-clamp-1">{article.title}</div>
                      {article.category && (
                        <div className="text-wiki-accent text-xs mt-0.5">{article.category.name}</div>
                      )}
                    </div>

                    {/* 操作 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveArticle(article.id, 'up')}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center text-wiki-text-muted hover:text-wiki-accent disabled:opacity-30 transition-colors"
                        title="上移"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveArticle(article.id, 'down')}
                        disabled={idx === selectedArticles.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-wiki-text-muted hover:text-wiki-accent disabled:opacity-30 transition-colors"
                        title="下移"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeArticle(article.id)}
                        className="w-6 h-6 flex items-center justify-center text-wiki-text-muted hover:text-wiki-danger transition-colors"
                        title="移除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Banner 預覽提示 */}
            {selectedArticles.length > 0 && (
              <div className="mt-4 p-3 bg-wiki-accent/5 border border-wiki-accent/20 rounded-lg">
                <p className="text-wiki-text-muted text-xs">
                  💡 無封面圖的文章不會在輪播中顯示。
                  <Link href="/" target="_blank" className="text-wiki-accent ml-1 hover:underline">
                    預覽首頁 →
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* 右側：搜索添加 */}
          <div className={cardCls}>
            <h2 className="text-wiki-text font-bold mb-4 flex items-center gap-2">
              <span className="text-wiki-accent text-sm">◆</span>搜索文章
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="輸入文章標題關鍵詞..."
                className={inputCls + ' text-sm'}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-wiki-accent text-wiki-dark text-sm font-bold rounded hover:bg-wiki-accent/90 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {searching ? '…' : '搜索'}
              </button>
            </div>

            {/* 搜索結果 */}
            {searchDone && searchResults.length === 0 && (
              <div className="text-center py-8 text-wiki-text-muted text-sm">
                未找到相關文章
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {searchResults.map(article => {
                  const isSelected = selectedIds.includes(article.id)
                  return (
                    <div
                      key={article.id}
                      className={`flex items-center gap-3 rounded-lg p-2.5 border transition-colors ${
                        isSelected
                          ? 'bg-wiki-accent/5 border-wiki-accent/30 opacity-60'
                          : 'bg-wiki-card border-wiki-border hover:border-wiki-accent/40 cursor-pointer'
                      }`}
                      onClick={() => !isSelected && addArticle(article)}
                    >
                      {/* 封面 */}
                      <div className="w-12 h-9 flex-shrink-0 rounded overflow-hidden bg-wiki-gray">
                        {article.coverImage ? (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-wiki-text-muted text-xs">
                            無圖
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-wiki-text text-sm font-bold line-clamp-1">
                          {article.title}
                        </div>
                        {article.category && (
                          <div className="text-wiki-accent text-xs">{article.category.name}</div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <span className="text-wiki-accent text-xs font-bold">已選</span>
                        ) : (
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-wiki-accent/10 text-wiki-accent text-sm font-bold hover:bg-wiki-accent/30 transition-colors">
                            +
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!searchDone && (
              <div className="text-center py-12 text-wiki-text-muted text-sm">
                <div className="text-2xl mb-2">🔍</div>
                <div>搜索文章後點擊即可添加</div>
              </div>
            )}
          </div>
        </div>

        {/* 底部保存 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : saved ? '✓ 已保存' : '保存 Banner 設置'}
          </button>
        </div>
      </div>
    </div>
  )
}
