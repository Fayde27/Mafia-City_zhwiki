'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'
import ImageUploadInput from '@/components/ImageUploadInput'
import RichTextEditor from '@/components/RichTextEditor'
import { useLocalDraft } from '@/hooks/useLocalDraft'

export default function AdminAnnouncementEditPage() {
  const router = useRouter()
  const params = useParams()
  const announcementId = params?.id as string
  const { isAdmin, isLoaded } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    banner: '',
    bannerPosition: '50% 50%',
    type: 'info',
    isActive: true,
    sortOrder: 0,
  })

  const { getDraft, clearDraft } = useLocalDraft(`draft_announcement_${announcementId}`, formData, draftReady)

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) { router.push('/admin/login'); return }
    fetch(`/api/admin/announcements/${announcementId}`)
      .then(res => res.json())
      .then(data => {
        const serverData = {
          title: data.title || '',
          content: data.content || '',
          banner: data.banner || '',
          bannerPosition: data.bannerPosition || '50% 50%',
          type: data.type || 'info',
          isActive: data.isActive !== false,
          sortOrder: data.sortOrder || 0,
        }
        const draft = getDraft()
        if (draft && draft.savedAt > new Date(data.updatedAt).getTime()) {
          const ago = Math.round((Date.now() - draft.savedAt) / 60000)
          if (confirm(`偵測到 ${ago} 分鐘前的未儲存草稿，是否還原？`)) {
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
      .catch(() => setLoading(false))
  }, [isAdmin, isLoaded, router, announcementId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/announcements/${announcementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        clearDraft()
        alert('更新成功')
        router.push('/admin/announcements')
      } else {
        const data = await res.json()
        alert(data.error || '保存失敗')
      }
    } catch {
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
            <h1 className="text-2xl font-heading font-bold text-wiki-accent heading-hard">編輯公告</h1>
            <p className="text-wiki-text-muted text-sm mt-1">修改公告詳細信息</p>
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
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="請輸入公告內容..."
                />
              </div>

              <div>
                <ImageUploadInput
                  label="BANNER 圖片"
                  value={formData.banner}
                  position={formData.bannerPosition}
                  onChange={(url) => setFormData({ ...formData, banner: url })}
                  onPositionChange={(pos) => setFormData({ ...formData, bannerPosition: pos })}
                  previewHeight="w-full aspect-[3/1]"
                />
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
            <button type="submit" disabled={saving} className="btn-hard text-wiki-text disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
            <Link href="/admin/announcements" className="px-6 py-3 bg-wiki-gray text-wiki-text font-bold uppercase tracking-wider">
              取消
            </Link>
          </div>
        </form>
      </main>

      <WikiFooter />
    </div>
  )
}
