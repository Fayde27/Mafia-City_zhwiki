'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
}

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params?.id as string
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    categoryId: '',
    tags: '',
    isPublished: false,
    sortOrder: 0,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then(res => res.json()),
      fetch(`/api/admin/articles/${articleId}`).then(res => res.json())
    ]).then(([cats, article]) => {
      setCategories(cats)
      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.summary || '',
        categoryId: article.categoryId,
        tags: article.tags || '',
        isPublished: article.isPublished,
        sortOrder: article.sortOrder,
      })
      setLoading(false)
    })
  }, [articleId])

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
        router.push('/admin/dashboard')
      } else {
        alert('更新失败')
      }
    } catch (err) {
      alert('网络错误')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-dark flex items-center justify-center">
        <div className="text-wiki-text-muted text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-dark">
      <header className="bg-wiki-darker border-b-2 border-wiki-accent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-wiki-text-muted hover:text-wiki-accent">
              ← 返回管理后台
            </Link>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              编辑文章
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="card-hard rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              别名 (URL Slug) *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              摘要
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-24"
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              分类 *
            </label>
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
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              内容 (支持 Markdown) *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none h-64 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">
              标签 (逗号分隔)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
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
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-hard text-white" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </button>
            <Link href="/admin/dashboard" className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
