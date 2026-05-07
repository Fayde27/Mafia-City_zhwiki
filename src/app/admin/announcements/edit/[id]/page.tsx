'use client'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter, useParams } from 'next/navigation'

export default function AdminAnnouncementEditPage() {
  const router = useRouter()
  const params = useParams()
  const announcementId = params?.id as string
  const { isAdmin, isLoaded } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerPositionX, setBannerPositionX] = useState(50)
  const [bannerPositionY, setBannerPositionY] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    banner: '',
    type: 'info',
    isActive: true,
    sortOrder: 0,
  })

  useEffect(() => {
    if (!isLoaded) return
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetch(`/api/admin/announcements/${announcementId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          title: data.title || '',
          content: data.content || '',
          banner: data.banner || '',
          type: data.type || 'info',
          isActive: data.isActive !== false,
          sortOrder: data.sortOrder || 0,
        })
        if (data.banner) {
          setBannerPreview(data.banner)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [isAdmin, isLoaded, router, announcementId])

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

  const handleBannerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleBannerMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const percentageX = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const percentageY = Math.max(0, Math.min(100, (y / rect.height) * 100))
    setBannerPositionX(percentageX)
    setBannerPositionY(percentageY)
  }

  const handleBannerMouseUp = () => {
    setIsDragging(false)
  }

  const handleBannerTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
  }

  const handleBannerTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const y = e.touches[0].clientY - rect.top
    const percentageX = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const percentageY = Math.max(0, Math.min(100, (y / rect.height) * 100))
    setBannerPositionX(percentageX)
    setBannerPositionY(percentageY)
  }

  const handleBannerTouchEnd = () => {
    setIsDragging(false)
  }

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
        alert('更新成功')
        router.push('/admin/announcements')
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
              编辑公告
            </h1>
            <p className="text-wiki-text-muted text-sm mt-1">修改公告详细信息</p>
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
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">公告标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">公告内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none resize-y"
                  required
                />
              </div>

              <div>
                <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">Banner 图片</label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex-1">
                      <span className="block text-wiki-text-muted text-xs mb-1">上传图片</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="w-full bg-wiki-gray border-2 border-wiki-border px-4 py-2 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none cursor-pointer"
                      />
                    </label>
                    <div className="flex-1">
                      <span className="block text-wiki-text-muted text-xs mb-1">或输入图片 URL</span>
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
                      <div
                        className="relative cursor-move select-none"
                        onMouseDown={handleBannerMouseDown}
                        onMouseMove={handleBannerMouseMove}
                        onMouseUp={handleBannerMouseUp}
                        onMouseLeave={handleBannerMouseUp}
                        onTouchStart={handleBannerTouchStart}
                        onTouchMove={handleBannerTouchMove}
                        onTouchEnd={handleBannerTouchEnd}
                      >
                        <div className="overflow-hidden" style={{ aspectRatio: '1920/1080' }}>
                          <img
                            src={bannerPreview}
                            alt="Banner 预览"
                            className="w-full h-full"
                            style={{
                              objectFit: 'cover',
                              objectPosition: `${bannerPositionX}% ${bannerPositionY}%`,
                            }}
                          />
                        </div>
                        <div
                          className="absolute w-4 h-4 border-2 border-wiki-accent rounded-full pointer-events-none"
                          style={{
                            left: `calc(${bannerPositionX}% - 8px)`,
                            top: `calc(${bannerPositionY}% - 8px)`,
                          }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-wiki-accent rounded-full" />
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                          拖动调整展示位置: X {Math.round(bannerPositionX)}% Y {Math.round(bannerPositionY)}%
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setBannerPreview(null); setBannerPositionX(50); setBannerPositionY(50); setFormData({ ...formData, banner: '' }) }}
                        className="absolute top-2 right-2 px-3 py-1 bg-wiki-danger text-white text-xs rounded hover:bg-wiki-danger/80 z-10"
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2">公告类型</label>
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
                  <span className="font-bold">立即发布</span>
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