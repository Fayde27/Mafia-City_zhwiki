'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'

interface CharacterCategory {
  id: string
  name: string
  slug: string
}

export default function AdminCharacterEditPage() {
  const router = useRouter()
  const params = useParams()
  const characterId = params?.id as string
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
    path: '',
    faction: '',
    combatType: '',
    gender: '',
    releaseDate: '',
    weapon: '',
    tags: '',
    description: '',
    stats: '',
    materials: '',
    story: '',
    otherInfo: '',
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
    fetchData()
  }, [isAdmin, isLoaded, router])

  const fetchData = async () => {
    try {
      const [catRes, charRes] = await Promise.all([
        fetch('/api/admin/character-categories'),
        characterId ? fetch(`/api/admin/characters/${characterId}`) : Promise.resolve(null),
      ])

      const catData = await catRes.json()
      setCategories(Array.isArray(catData) ? catData : [])

      if (charRes && characterId) {
        const charData = await charRes.json()
        if (charData.id) {
          setFormData({
            name: charData.name || '',
            slug: charData.slug || '',
            title: charData.title || '',
            avatar: charData.avatar || '',
            banner: charData.banner || '',
            rarity: charData.rarity || 5,
            path: charData.path || '',
            faction: charData.faction || '',
            combatType: charData.combatType || '',
            gender: charData.gender || '',
            releaseDate: charData.releaseDate || '',
            weapon: charData.weapon || '',
            tags: charData.tags || '',
            description: charData.description || '',
            stats: charData.stats || '',
            materials: charData.materials || '',
            story: charData.story || '',
            otherInfo: charData.otherInfo || '',
            categoryId: charData.categoryId || '',
            sortOrder: charData.sortOrder || 0,
            isPublished: charData.isPublished || false,
          })
        }
      }

      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = characterId
        ? `/api/admin/characters/${characterId}`
        : '/api/admin/characters'
      const method = characterId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert(characterId ? '更新成功' : '创建成功')
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
      <div className="min-h-screen bg-wiki-dark">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">加载中...</div>
        <WikiFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-dark">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              {characterId ? '编辑角色' : '新增角色'}
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">填写角色详细信息</p>
          </div>
          <Link href="/admin/characters" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-hard rounded-lg p-6">
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

            <div className="card-hard rounded-lg p-6">
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
            <div className="card-hard rounded-lg p-6">
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
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">性别</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                    >
                      <option value="">请选择</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">命途</label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      placeholder="如: 毁灭"
                    />
                  </div>
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">战斗属性</label>
                    <input
                      type="text"
                      value={formData.combatType}
                      onChange={(e) => setFormData({ ...formData, combatType: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      placeholder="如: 物理"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">阵营</label>
                    <input
                      type="text"
                      value={formData.faction}
                      onChange={(e) => setFormData({ ...formData, faction: e.target.value })}
                      className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                      placeholder="如: 贝洛伯格"
                    />
                  </div>
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
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">实装日期</label>
                  <input
                    type="text"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="如: 2023年04月26日"
                  />
                </div>
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">标签 (逗号分隔)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                    placeholder="如: 反击,追加攻击,物理输出"
                  />
                </div>
              </div>
            </div>

            <div className="card-hard rounded-lg p-6">
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

          <div className="card-hard rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">角色简介</h3>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y"
              placeholder="支持Markdown格式"
            />
          </div>

          <div className="card-hard rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">属性数据 (Markdown)</h3>
            <textarea
              value={formData.stats}
              onChange={(e) => setFormData({ ...formData, stats: e.target.value })}
              rows={6}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 属性数据&#10;&#10;| 等级 | 生命值 | 攻击力 | 防御力 |&#10;|------|--------|--------|--------|"
            />
          </div>

          <div className="card-hard rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">晋升材料 (Markdown)</h3>
            <textarea
              value={formData.materials}
              onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
              rows={6}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 晋升材料&#10;&#10;### 20级&#10;- 古代零件 x5&#10;- 信用点 x4000"
            />
          </div>

          <div className="card-hard rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">角色故事 (Markdown)</h3>
            <textarea
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              rows={8}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 角色故事&#10;&#10;### 角色详情&#10;..."
            />
          </div>

          <div className="card-hard rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">其他信息 (Markdown)</h3>
            <textarea
              value={formData.otherInfo}
              onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
              rows={6}
              className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y font-mono text-sm"
              placeholder="## 其他信息&#10;&#10;### 昵称/外号&#10;- xxx"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-hard text-white disabled:opacity-50"
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
