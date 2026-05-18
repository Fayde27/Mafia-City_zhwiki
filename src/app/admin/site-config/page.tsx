'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useRouter } from 'next/navigation'
import ImageUploadInput from '@/components/ImageUploadInput'

export default function SiteConfigPage() {
  const { isAdmin, isLoaded } = useAdminAuth()
  const router = useRouter()

  const [bannerImage, setBannerImage] = useState('')
  const [bannerPosition, setBannerPosition] = useState('50% 50%')
  const [hotTags, setHotTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isLoaded && !isAdmin) router.push('/admin/login')
  }, [isAdmin, authLoading, router])

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(r => r.json())
      .then(config => {
        setBannerImage(config.searchBannerImage || '')
        setBannerPosition(config.searchBannerPosition || '50% 50%')
        setHotTags(config.hotSearchTags || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchBannerImage: bannerImage,
          searchBannerPosition: bannerPosition,
          hotSearchTags: hotTags,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-wiki-text">
            <span className="text-wiki-accent mr-2">◆</span>站点配置
          </h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors"
          >
            ← 返回后台
          </button>
        </div>

        <div className="space-y-6">
          {/* 搜索 Banner */}
          <div className="bg-wiki-card border border-wiki-border rounded-xl p-6">
            <h2 className="text-wiki-text font-bold mb-4 flex items-center gap-2">
              <span className="text-wiki-accent text-sm">◆</span>首页搜索 Banner
            </h2>
            <ImageUploadInput
              label="Banner 图片"
              value={bannerImage}
              position={bannerPosition}
              onChange={setBannerImage}
              onPositionChange={setBannerPosition}
              previewHeight="h-40"
            />
            <p className="text-wiki-text-muted text-xs mt-2">
              不上传图片时，显示默认纹理背景。上传后可拖拽调整图片焦点。
            </p>
          </div>

          {/* 热门搜索词 */}
          <div className="bg-wiki-card border border-wiki-border rounded-xl p-6">
            <h2 className="text-wiki-text font-bold mb-1 flex items-center gap-2">
              <span className="text-wiki-accent text-sm">◆</span>热门搜索词
            </h2>
            <p className="text-wiki-text-muted text-xs mb-4">多个词条用英文逗号分隔，显示在搜索框下方</p>
            <textarea
              value={hotTags}
              onChange={e => setHotTags(e.target.value)}
              rows={3}
              placeholder="新手入门,角色攻略,装备图鉴,建筑攻略,阵容搭配,赛事活动"
              className="w-full bg-wiki-bg border border-wiki-border rounded-lg px-4 py-2.5 text-wiki-text text-sm focus:border-wiki-accent focus:outline-none resize-none"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {hotTags.split(',').filter(t => t.trim()).map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-wiki-gray text-wiki-text-secondary text-xs rounded-full border border-wiki-border">
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-wiki-accent text-wiki-dark font-bold rounded-lg hover:bg-wiki-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : saved ? '✓ 已保存' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  )
}
