'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import { useLocalDraft } from '@/hooks/useLocalDraft'

interface Category {
  id: string
  name: string
  slug: string
}

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, isLoaded } = useAdminAuth()
  const articleId = params?.id as string
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    coverImage: '',
    coverImagePosition: '50% 50%',
    categoryId: '',
    tags: '',
    isPublished: true,
    isPinned: false,
    isFeatured: false,
    badges: '',
    sortOrder: 0,
  })

  const { getDraft, clearDraft } = useLocalDraft(`draft_article_${articleId}`, formData, draftReady)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    Promise.all([
      fetch('/api/admin/categories').then(res => res.json()),
      fetch(`/api/admin/articles/${articleId}`).then(res => res.json()),
    ]).then(([cats, article]) => {
      setCategories(cats)
      const serverData = {
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.summary || '',
        coverImage: article.coverImage || '',
        coverImagePosition: article.coverImagePosition || '50% 50%',
        categoryId: article.categoryId,
        tags: article.tags || '',
        isPublished: article.isPublished,
        isPinned: article.isPinned || false,
        isFeatured: article.isFeatured || false,
        badges: article.badges || '',
        sortOrder: article.sortOrder,
      }

      // 檢查是否有比伺服器更新的草稿
      const draft = getDraft()
      if (draft && draft.savedAt > new Date(article.updatedAt).getTime()) {
        const ago = Math.round((Date.now() - draft.savedAt) / 60000)
        const msg = `偵測到 ${ago} 分鐘前的未儲存草稿，是否還原？（取消則使用已儲存版本）`
        if (confirm(msg)) {
          setFormData(draft.data)
        } else {
          clearDraft()
          setFormData(serverData)
        }
      } else {
        setFormData(serverData)
      }
      setLoading(false)
      setDraftReady(true)
    })
  }, [articleId, isAdmin, isLoaded, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        clearDraft()
        alert('已儲存')
      } else {
        alert('更新失敗')
      }
    } catch {
      alert('網絡錯誤')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`確定要刪除文章「${formData.title}」？此操作無法還原。`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        alert('刪除失敗')
      }
    } catch {
      alert('網絡錯誤')
    } finally {
      setDeleting(false)
    }
  }

  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-wiki-text-muted text-xl">載入中...</div>
        </div>
        <WikiFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      {/* 預覽覆蓋層 */}
      {previewing && (
        <div className="fixed inset-0 z-50 bg-wiki-bg overflow-y-auto">
          <div className="sticky top-0 z-10 bg-wiki-dark border-b border-wiki-border/20 px-4 py-3 flex items-center justify-between">
            <span className="text-wiki-text-muted text-sm">預覽模式（未儲存的修改不會影響線上版本）</span>
            <button
              onClick={() => setPreviewing(false)}
              className="flex items-center gap-2 px-4 py-1.5 bg-wiki-accent text-wiki-dark text-sm font-bold rounded-lg hover:bg-wiki-accent/90"
            >
              ← 返回編輯
            </button>
          </div>
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {formData.coverImage && (
              <div className="w-full h-64 rounded-xl overflow-hidden mb-6">
                <img
                  src={formData.coverImage}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: formData.coverImagePosition }}
                />
              </div>
            )}
            <h1 className="text-3xl font-bold text-wiki-text mb-4">{formData.title || '（無標題）'}</h1>
            {formData.summary && (
              <p className="text-wiki-text-muted mb-6 text-sm border-l-4 border-wiki-accent pl-4">{formData.summary}</p>
            )}
            <div
              className="prose prose-invert max-w-none text-wiki-text"
              dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-wiki-text-muted">（無內容）</p>' }}
            />
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">編輯文章</h1>
            <p className="text-wiki-text-muted text-sm mt-1">修改文章內容、分類和發佈狀態</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-wiki-border text-wiki-text-secondary text-sm rounded-lg hover:border-wiki-accent hover:text-wiki-accent transition-colors"
            >
              👁 預覽
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 border border-wiki-danger/40 text-wiki-danger text-sm rounded-lg hover:bg-wiki-danger/10 transition-colors disabled:opacity-50"
            >
              {deleting ? '刪除中...' : '🗑 刪除文章'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">標題 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">別名 (URL Slug) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">摘要</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-24"
            />
          </div>

          <div>
            <ImageUploadInput
              label="封面圖片"
              value={formData.coverImage}
              position={formData.coverImagePosition}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              onPositionChange={(pos) => setFormData({ ...formData, coverImagePosition: pos })}
              previewHeight="w-full aspect-[3/1]"
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">分類 *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              required
            >
              <option value="">請選擇分類</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">內容 *</label>
            <RichTextEditor
              value={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
              placeholder="請輸入文章內容..."
              minHeight="min-h-[400px]"
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">標籤 (逗號分隔)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="w-5 h-5" />
              <span className="text-wiki-text font-bold">立即發佈</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isPinned} onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })} className="w-5 h-5" />
              <span className="text-wiki-text font-bold">置頂文章</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-5 h-5" />
              <span className="text-wiki-text font-bold">在首頁熱門攻略顯示</span>
            </label>
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">文章標誌 (逗號分隔)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['HOT', 'NEW', 'STAR', '推薦', '精華'].map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => {
                    const current = formData.badges ? formData.badges.split(',').filter(Boolean) : []
                    const updated = current.includes(badge) ? current.filter(b => b !== badge).join(',') : [...current, badge].join(',')
                    setFormData({ ...formData, badges: updated })
                  }}
                  className={`px-3 py-1 text-xs font-bold border-2 ${formData.badges?.split(',').includes(badge) ? 'bg-wiki-accent/20 border-wiki-accent text-wiki-accent' : 'bg-wiki-gray border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'}`}
                >
                  {badge}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.badges}
              onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="自定義標誌，逗號分隔，如: HOT,星標"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-hard text-wiki-text" disabled={saving}>
              {saving ? '儲存中...' : '儲存'}
            </button>
            <button type="button" onClick={() => setPreviewing(true)} className="px-6 py-3 border border-wiki-border text-wiki-text-secondary font-bold hover:border-wiki-accent hover:text-wiki-accent transition-colors">
              👁 預覽
            </button>
            <Link href="/admin/dashboard" className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
              取消
            </Link>
          </div>
        </form>
      </main>

      <WikiFooter />
    </div>
  )
}
