'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'

interface BuildingCategory {
  id: string
  name: string
  slug: string
}

export default function AdminBuildingNewPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [categories, setCategories] = useState<BuildingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    iconPosition: '50% 50%',
    image: '',
    imagePosition: '50% 50%',
    rarity: 3,
    type: '',
    function: '',
    unlockCondition: '',
    summary: '',
    isFeatured: false,
    level: 1,
    maxLevel: 10,
    cost: '',
    production: '',
    description: '',
    details: '',
    upgradeInfo: '',
    upgradeLevels: JSON.stringify({ columns: ['等級', '升級條件', '建造時間', '效果加成'], rows: [] }),
    publishedAt: '',
    categoryId: '',
    sortOrder: 0,
    isPublished: true,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetch('/api/admin/building-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [isAdmin, isLoaded, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('創建成功')
        router.push('/admin/buildings')
      } else {
        const data = await res.json()
        alert(data.error || '保存失敗')
      }
    } catch (err) {
      alert('網絡錯誤')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
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
              新增建築
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">填寫建築詳細信息</p>
          </div>
          <Link href="/admin/buildings" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">基本信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">建築名稱 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">URL Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="英文小寫，如: town-hall"
                    required
                  />
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">所屬分類 *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">請選擇分類</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">圖片上傳</h3>
              <div className="space-y-6">
                <ImageUploadInput
                  label="圖標"
                  value={formData.icon}
                  position={formData.iconPosition}
                  onChange={(url) => setFormData({ ...formData, icon: url })}
                  onPositionChange={(pos) => setFormData({ ...formData, iconPosition: pos })}
                  previewHeight="h-32 aspect-square"
                />
                <ImageUploadInput
                  label="圖片"
                  value={formData.image}
                  position={formData.imagePosition}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  onPositionChange={(pos) => setFormData({ ...formData, imagePosition: pos })}
                  previewHeight="w-full aspect-[3/1]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">建築屬性</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">稀有度</label>
                    <select
                      value={formData.rarity}
                      onChange={(e) => setFormData({ ...formData, rarity: parseInt(e.target.value) })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                    >
                      <option value={1}>★</option>
                      <option value={2}>★★</option>
                      <option value={3}>★★★</option>
                      <option value={4}>★★★★</option>
                      <option value={5}>★★★★★</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">建築類型</label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      placeholder="如: 資源建築"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">功能</label>
                  <input
                    type="text"
                    value={formData.function}
                    onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="如: 生產金幣"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">初始等級</label>
                    <input
                      type="number"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">最大等級</label>
                    <input
                      type="number"
                      value={formData.maxLevel}
                      onChange={(e) => setFormData({ ...formData, maxLevel: parseInt(e.target.value) })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">建造消耗</label>
                  <input
                    type="text"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="如: 1000金幣"
                  />
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">產出</label>
                  <input
                    type="text"
                    value={formData.production}
                    onChange={(e) => setFormData({ ...formData, production: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="如: 100金幣/小時"
                  />
                </div>
              </div>
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">發佈設置</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-5 h-5 accent-wiki-accent cursor-pointer"
                    />
                    <span className="font-bold">立即發佈</span>
                  </label>
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">排序值</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">建築簡介 (Markdown)</h3>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
              minHeight="min-h-[160px]"
            />
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">詳細信息 (Markdown)</h3>
            <RichTextEditor
              value={formData.details}
              onChange={(html) => setFormData({ ...formData, details: html })}
              minHeight="min-h-[160px]"
            />
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">升級信息 (Markdown)</h3>
            <RichTextEditor
              value={formData.upgradeInfo}
              onChange={(html) => setFormData({ ...formData, upgradeInfo: html })}
              minHeight="min-h-[160px]"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-hard text-wiki-text disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <Link
              href="/admin/buildings"
              className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider"
            >
              取消
            </Link>
          </div>
        </form>
      </main>

      <WikiFooter />
    </div>
  )
}
