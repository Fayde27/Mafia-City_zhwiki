'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
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
    coverImagePosition: '50% 50%',
    isPublished: false,
    isPinned: false,
    isFeatured: false,
    badges: '',
    sortOrder: 0,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
  }, [isAdmin, isLoaded, router])

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
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              新增文章
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">创建新的Wiki文章，支持Markdown格式</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">别名 (URL Slug) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="例如: character-guide-001"
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
              label="封面图片"
              value={formData.coverImage}
              position={formData.coverImagePosition}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              onPositionChange={(pos) => setFormData({ ...formData, coverImagePosition: pos })}
              previewHeight="w-full aspect-[3/1]"
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">分类 *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
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
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">内容 *</label>
            <RichTextEditor
              value={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
              placeholder="请输入文章内容..."
              minHeight="min-h-[400px]"
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">标签 (逗号分隔)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
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
              <span className="text-wiki-text font-bold">立即发布</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-wiki-text font-bold">置顶文章</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-wiki-text font-bold">在首页热门攻略显示</span>
            </label>
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">文章标志 (逗号分隔)</label>
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
                      ? 'bg-wiki-accent/20 border-wiki-accent text-wiki-accent'
                      : 'bg-wiki-gray border-wiki-border text-wiki-text-muted hover:border-wiki-accent/50'
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
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="自定义标志，逗号分隔，如: HOT,星标"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-hard text-wiki-text" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
            <Link href="/" className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
              取消
            </Link>
          </div>
        </form>
      </main>

      <WikiFooter />
    </div>
  )
}
