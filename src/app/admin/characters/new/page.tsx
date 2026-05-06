'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'

interface CharacterCategory {
  id: string
  name: string
  slug: string
}

export default function AdminCharacterNewPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [categories, setCategories] = useState<CharacterCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    title: '',
    avatar: '',
    banner: '',
    rarity: 5,
    role: '',
    weapon: '',
    coreBonus: '',
    acquisition: '',
    description: '',
    attributes: '',
    skills: '',
    rumors: '',
    teamComp: '',
    troopRec: '',
    categoryId: '',
    sortOrder: 0,
    isPublished: false,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetch('/api/admin/character-categories')
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
      const res = await fetch('/api/admin/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('创建成功')
        router.push('/admin/characters')
      } else {
        const data = await res.json()
        alert(data.error || '保存失败')
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
        <div className="text-center py-20 text-wiki-text-muted">加载中...</div>
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
              新增角色
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">填写角色详细信息</p>
          </div>
          <Link href="/admin/characters" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">基本信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">角色名称 *</label>
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
                    placeholder="英文小写，如: clara"
                    required
                  />
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">称号/标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="如: 被机器人养大的女孩"
                  />
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">所属分类 *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">请选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">图片链接</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">头像 URL</label>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="/images/characters/xxx-avatar.jpg"
                  />
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">Banner URL</label>
                  <input
                    type="text"
                    value={formData.banner}
                    onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="/images/characters/xxx-banner.jpg"
                  />
                </div>
                {formData.banner && (
                  <div className="rounded-lg overflow-hidden h-32 bg-wiki-gray">
                    <img src={formData.banner} alt="Banner预览" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">角色属性</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">稀有度</label>
                    <select
                      value={formData.rarity}
                      onChange={(e) => setFormData({ ...formData, rarity: parseInt(e.target.value) })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                    >
                      <option value={3}>★★★</option>
                      <option value={4}>★★★★</option>
                      <option value={5}>★★★★★</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">角色定位</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      placeholder="如: 毁灭"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">适配兵种</label>
                    <input
                      type="text"
                      value={formData.weapon}
                      onChange={(e) => setFormData({ ...formData, weapon: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      placeholder="如: 剑"
                    />
                  </div>
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">核心加成</label>
                    <input
                      type="text"
                      value={formData.coreBonus}
                      onChange={(e) => setFormData({ ...formData, coreBonus: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      placeholder="如: 攻击力提升"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">获取方式</label>
                  <input
                    type="text"
                    value={formData.acquisition}
                    onChange={(e) => setFormData({ ...formData, acquisition: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="如: 常驻跃迁"
                  />
                </div>
              </div>
            </div>

            <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
              <h3 className="text-lg font-bold text-wiki-accent mb-4">发布设置</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-5 h-5 accent-wiki-accent cursor-pointer"
                    />
                    <span className="font-bold">立即发布</span>
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
            <h3 className="text-lg font-bold text-wiki-accent mb-4">角色简介</h3>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y"
              placeholder="支持Markdown格式"
            />
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">角色属性 (Markdown)</h3>
            <textarea
              value={formData.attributes}
              onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
              rows={6}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 角色属性&#10;&#10;| 等级 | 生命值 | 攻击力 | 防御力 |&#10;|------|--------|--------|--------|"
            />
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">技能详情 (Markdown)</h3>
            <textarea
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              rows={6}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 技能详情&#10;&#10;### 普通攻击&#10;- xxx"
            />
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">黑道传闻 (Markdown)</h3>
            <textarea
              value={formData.rumors}
              onChange={(e) => setFormData({ ...formData, rumors: e.target.value })}
              rows={8}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 黑道传闻&#10;&#10;### 传闻一&#10;..."
            />
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">阵容搭配 (Markdown)</h3>
            <textarea
              value={formData.teamComp}
              onChange={(e) => setFormData({ ...formData, teamComp: e.target.value })}
              rows={6}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 阵容搭配&#10;&#10;### 推荐阵容&#10;- xxx"
            />
          </div>

          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">配兵推荐 (Markdown)</h3>
            <textarea
              value={formData.troopRec}
              onChange={(e) => setFormData({ ...formData, troopRec: e.target.value })}
              rows={6}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 配兵推荐&#10;&#10;### 推荐配兵&#10;- xxx"
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
              href="/admin/characters"
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
