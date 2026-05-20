'use client'

export const runtime = 'edge'


import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import { useLocalDraft } from '@/hooks/useLocalDraft'

export default function AdminAnnouncementNewPage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useAdminAuth()
  const [saving, setSaving] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    banner: '',
    type: 'info',
    isActive: true,
    sortOrder: 0,
  })

  const { getDraft, clearDraft } = useLocalDraft('draft_announcement_new', formData, draftReady)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    const draft = getDraft()
    if (draft && draft.data.title) {
      const ago = Math.round((Date.now() - draft.savedAt) / 60000)
      if (confirm(`偵測到 ${ago} 分鐘前的未儲存草稿「${draft.data.title}」，是否還原？`)) {
        setFormData(draft.data)
      } else {
        clearDraft()
      }
    }
    setDraftReady(true)
  }, [isAdmin, isLoaded, router])

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setBannerPreview(result)
        setFormData({ ...formData, banner: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerUrlChange = (url: string) => {
    setBannerPreview(url || null)
    setFormData({ ...formData, banner: url })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        clearDraft()
        alert('創建成功')
        router.push('/admin/announcements')
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

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">
              新增公告
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">填寫公告詳細信息</p>
          </div>
          <Link href="/admin/announcements" className="px-4 py-2 bg-wiki-gray text-wiki-text font-bold text-sm hover:text-wiki-accent">
            返回列表
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-wiki-accent mb-4">基本信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">公告標題 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">公告內容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y"
                  required
                />
              </div>

              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">Banner 圖片</label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex-1">
                      <span className="block text-wiki-text-muted text-xs mb-1">上傳圖片</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none cursor-pointer"
                      />
                    </label>
                    <div className="flex-1">
                      <span className="block text-wiki-text-muted text-xs mb-1">或輸入圖片 URL</span>
                      <input
                        type="text"
                        value={formData.banner}
                        onChange={(e) => handleBannerUrlChange(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none"
                      />
                    </div>
                  </div>
                  {bannerPreview && (
                    <div className="relative rounded-lg overflow-hidden border border-wiki-border">
                      <img src={bannerPreview} alt="Banner 預覽" className="w-full h-48 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setBannerPreview(null); setFormData({ ...formData, banner: '' }) }}
                        className="absolute top-2 right-2 px-3 py-1 bg-wiki-danger text-white text-xs rounded hover:bg-wiki-danger/80"
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">公告類型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none cursor-pointer"
                  >
                    <option value="info">公告</option>
                    <option value="new">NEW</option>
                    <option value="update">UPDATE</option>
                    <option value="important">重要</option>
                  </select>
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

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-wiki-text cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 accent-wiki-accent cursor-pointer"
                  />
                  <span className="font-bold">立即發佈</span>
                </label>
              </div>
            </div>
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
              href="/admin/announcements"
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