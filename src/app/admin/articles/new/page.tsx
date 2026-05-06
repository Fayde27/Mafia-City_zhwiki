'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const { isAdmin } = useAdminAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    categoryId: '',
    tags: '',
    coverImage: '',
    isPublished: false,
    isPinned: false,
    badges: '',
    sortOrder: 0,
  })

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
  }, [isAdmin, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setFormData(prev => ({ ...prev, coverImage: data.url }))
      }
    } catch (err) {
      alert('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const insertImageToContent = (url: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + `\n![图片](${url})\n`,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/wiki/article/' + formData.slug)
      } else {
        alert('创建失败')
      }
    } catch (err) {
      alert('网络错误')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-white">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#e8c547] heading-hard">
              新增文章
            </h1>
            <p className="text-gray-900-muted text-sm mt-1">创建新的Wiki文章，支持Markdown格式</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card-hard rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">别名 (URL Slug) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
              placeholder="例如: character-guide-001"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">摘要</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none h-24"
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">封面图片</label>
            <div className="flex gap-4 items-start">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 flex-1"
                disabled={uploading}
              />
              {uploading && <span className="text-[#e8c547] py-3">上传中...</span>}
            </div>
            {formData.coverImage && (
              <div className="mt-2">
                <img src={formData.coverImage} alt="封面" className="h-32 rounded border border-gray-200" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">分类 *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
              required
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">内容 (支持 Markdown) *</label>
            <div className="flex gap-2 mb-2">
              <label className="btn-hard text-gray-900 text-xs py-2 px-4 cursor-pointer">
                上传图片
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const formData = new FormData()
                      formData.append('file', file)
                      setUploading(true)
                      fetch('/api/admin/upload', { method: 'POST', body: formData })
                        .then(res => res.json())
                        .then(data => {
                          if (data.url) insertImageToContent(data.url)
                        })
                        .finally(() => setUploading(false))
                    }
                  }}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {uploading && <span className="text-[#e8c547] py-2">上传中...</span>}
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none h-64 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">标签 (逗号分隔)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
              placeholder="例如: 角色,图鉴,攻略"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-gray-900 font-bold">立即发布</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-gray-900 font-bold">置顶文章</span>
            </label>
          </div>

          <div>
            <label className="block text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">文章标志 (逗号分隔)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['HOT', 'NEW', 'STAR', '推荐', '精华'].map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => {
                    const current = formData.badges ? formData.badges.split(',').filter(Boolean) : []
                    const updated = current.includes(badge)
                      ? current.filter(b => b !== badge).join(',')
                      : [...current, badge].join(',')
                    setFormData({ ...formData, badges: updated })
                  }}
                  className={`px-3 py-1 text-xs font-bold border-2 ${
                    formData.badges?.split(',').includes(badge)
                      ? 'bg-wiki-accent/20 border-wiki-accent text-[#e8c547]'
                      : 'bg-gray-100 border-gray-200 text-gray-900-muted hover:border-wiki-accent/50'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.badges}
              onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
              className="w-full bg-gray-100 border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-wiki-accent focus:outline-none"
              placeholder="自定义标志，逗号分隔，如: HOT,星标"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-hard text-gray-900" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
            <Link href="/" className="px-6 py-3 bg-gray-100 text-gray-900 font-bold uppercase tracking-wider">
              取消
            </Link>
          </div>
        </form>
      </main>

      <WikiFooter />
    </div>
  )
}
