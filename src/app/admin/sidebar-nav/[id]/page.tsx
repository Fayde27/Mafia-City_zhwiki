'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function EditSidebarNavPage() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, isLoaded } = useAdminAuth()
  const itemId = params?.id as string
  const isNew = !itemId || itemId === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    section: 'quick-entry',
    label: '',
    icon: '',
    href: '',
    sortOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    if (!isNew && itemId) {
      fetch(`/api/admin/sidebar-nav/${itemId}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            section: data.section,
            label: data.label,
            icon: data.icon || '',
            href: data.href,
            sortOrder: data.sortOrder,
            isActive: data.isActive,
          })
          setLoading(false)
        })
    }
  }, [itemId, isNew, isAdmin, isLoaded, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = isNew ? '/api/admin/sidebar-nav' : `/api/admin/sidebar-nav/${itemId}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/admin/sidebar-nav')
      } else {
        alert('保存失败')
      }
    } catch (err) {
      alert('网络错误')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-wiki-text-muted text-xl">加载中...</div>
        </div>
        <WikiFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              {isNew ? '新增导航项' : '编辑导航项'}
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">设置侧边栏导航的显示内容和跳转链接</p>
          </div>
          <Link href="/admin/sidebar-nav" className="text-wiki-text-muted hover:text-wiki-accent text-sm">
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">所属分组 *</label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              required
            >
              <option value="quick-entry">新手快速入口</option>
              <option value="shortcut">快捷功能</option>
            </select>
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">显示名称 *</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="例如: 图鉴、玩法攻略"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">图标 (Emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="例如: 📚、、👤"
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">跳转链接 *</label>
            <input
              type="text"
              value={formData.href}
              onChange={(e) => setFormData({ ...formData, href: e.target.value })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="例如: /wiki、/wiki/guides"
              required
            />
          </div>

          <div>
            <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序权重</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
              placeholder="数字越大越靠前"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-wiki-text font-bold">在侧边栏显示</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-hard text-wiki-text" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </button>
            <Link href="/admin/sidebar-nav" className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
              取消
            </Link>
          </div>
        </form>
      </main>

      <WikiFooter />
    </div>
  )
}
