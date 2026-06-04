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

  // 文章頁背景立繪
  const [bgEnabled, setBgEnabled] = useState(false)
  const [bgLeftUrl, setBgLeftUrl] = useState('')
  const [bgLeftOpacity, setBgLeftOpacity] = useState(0.85)
  const [bgLeftScale, setBgLeftScale] = useState(1)
  const [bgLeftOffsetY, setBgLeftOffsetY] = useState(0)
  const [bgLeftFlip, setBgLeftFlip] = useState(false)
  const [bgRightUrl, setBgRightUrl] = useState('')
  const [bgRightOpacity, setBgRightOpacity] = useState(0.85)
  const [bgRightScale, setBgRightScale] = useState(1)
  const [bgRightOffsetY, setBgRightOffsetY] = useState(0)
  const [bgRightFlip, setBgRightFlip] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isLoaded && !isAdmin) router.push('/admin/login')
  }, [isAdmin, isLoaded, router])

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(r => r.json())
      .then(config => {
        setBannerImage(config.searchBannerImage || '')
        setBannerPosition(config.searchBannerPosition || '50% 50%')
        setHotTags(config.hotSearchTags || '')
        setBgEnabled(config.articleBgEnabled === '1')
        setBgLeftUrl(config.articleBgLeftUrl || '')
        setBgLeftOpacity(parseFloat(config.articleBgLeftOpacity || '0.85'))
        setBgLeftScale(parseFloat(config.articleBgLeftScale || '1'))
        setBgLeftOffsetY(parseInt(config.articleBgLeftOffsetY || '0'))
        setBgLeftFlip(config.articleBgLeftFlip === '1')
        setBgRightUrl(config.articleBgRightUrl || '')
        setBgRightOpacity(parseFloat(config.articleBgRightOpacity || '0.85'))
        setBgRightScale(parseFloat(config.articleBgRightScale || '1'))
        setBgRightOffsetY(parseInt(config.articleBgRightOffsetY || '0'))
        setBgRightFlip(config.articleBgRightFlip === '1')
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
          articleBgEnabled: bgEnabled ? '1' : '0',
          articleBgLeftUrl: bgLeftUrl,
          articleBgLeftOpacity: String(bgLeftOpacity),
          articleBgLeftScale: String(bgLeftScale),
          articleBgLeftOffsetY: String(bgLeftOffsetY),
          articleBgLeftFlip: bgLeftFlip ? '1' : '0',
          articleBgRightUrl: bgRightUrl,
          articleBgRightOpacity: String(bgRightOpacity),
          articleBgRightScale: String(bgRightScale),
          articleBgRightOffsetY: String(bgRightOffsetY),
          articleBgRightFlip: bgRightFlip ? '1' : '0',
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('保存失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">載入中...</div>
  }

  return (
    <div className="min-h-screen bg-wiki-bg">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-wiki-text">
            <span className="text-wiki-accent mr-2">◆</span>站點配置
          </h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-wiki-text-muted text-sm hover:text-wiki-accent transition-colors"
          >
            ← 返回後台
          </button>
        </div>

        <div className="space-y-6">
          {/* 搜索 Banner */}
          <div className="bg-wiki-card border border-wiki-border rounded-xl p-6">
            <h2 className="text-wiki-text font-bold mb-4 flex items-center gap-2">
              <span className="text-wiki-accent text-sm">◆</span>首頁搜索 Banner
            </h2>
            <ImageUploadInput
              label="Banner 圖片"
              value={bannerImage}
              position={bannerPosition}
              onChange={setBannerImage}
              onPositionChange={setBannerPosition}
              previewHeight="h-40"
            />
            <p className="text-wiki-text-muted text-xs mt-2">
              不上傳圖片時，顯示預設紋理背景。上傳後可拖拽調整圖片焦點。
            </p>
          </div>

          {/* 熱門搜索詞 */}
          <div className="bg-wiki-card border border-wiki-border rounded-xl p-6">
            <h2 className="text-wiki-text font-bold mb-1 flex items-center gap-2">
              <span className="text-wiki-accent text-sm">◆</span>熱門搜索詞
            </h2>
            <p className="text-wiki-text-muted text-xs mb-4">多個詞條用英文逗號分隔，顯示在搜索框下方</p>
            <textarea
              value={hotTags}
              onChange={e => setHotTags(e.target.value)}
              rows={3}
              placeholder="新手入門,角色攻略,裝備圖鑑,建築攻略,陣容搭配,賽事活動"
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

          {/* 文章頁背景立繪 */}
          <div className="bg-wiki-card border border-wiki-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-wiki-text font-bold flex items-center gap-2">
                <span className="text-wiki-accent text-sm">◆</span>文章頁背景立繪
              </h2>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-wiki-text-muted text-sm">{bgEnabled ? '已啟用' : '已停用'}</span>
                <div
                  onClick={() => setBgEnabled(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${bgEnabled ? 'bg-wiki-accent' : 'bg-wiki-border'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${bgEnabled ? 'left-6' : 'left-1'}`} />
                </div>
              </label>
            </div>

            {bgEnabled && (
              <div className="space-y-6">
                {/* ── 左側立繪 ── */}
                <div className="border border-wiki-border rounded-lg p-4">
                  <h3 className="text-wiki-text text-sm font-bold mb-3">左側立繪</h3>
                  <ImageUploadInput
                    label="左側圖片"
                    value={bgLeftUrl}
                    position="50% 50%"
                    onChange={setBgLeftUrl}
                    onPositionChange={() => {}}
                    previewHeight="h-48"
                  />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-wiki-text-muted text-xs mb-1">透明度 {Math.round(bgLeftOpacity * 100)}%</label>
                      <input type="range" min="0.1" max="1" step="0.05"
                        value={bgLeftOpacity} onChange={e => setBgLeftOpacity(parseFloat(e.target.value))}
                        className="w-full accent-wiki-accent" />
                    </div>
                    <div>
                      <label className="block text-wiki-text-muted text-xs mb-1">縮放 {bgLeftScale.toFixed(2)}x</label>
                      <input type="range" min="0.5" max="2" step="0.05"
                        value={bgLeftScale} onChange={e => setBgLeftScale(parseFloat(e.target.value))}
                        className="w-full accent-wiki-accent" />
                    </div>
                    <div>
                      <label className="block text-wiki-text-muted text-xs mb-1">垂直偏移 {bgLeftOffsetY}px</label>
                      <input type="range" min="-300" max="300" step="10"
                        value={bgLeftOffsetY} onChange={e => setBgLeftOffsetY(parseInt(e.target.value))}
                        className="w-full accent-wiki-accent" />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input type="checkbox" id="bgLeftFlip" checked={bgLeftFlip}
                        onChange={e => setBgLeftFlip(e.target.checked)}
                        className="accent-wiki-accent w-4 h-4" />
                      <label htmlFor="bgLeftFlip" className="text-wiki-text-muted text-xs cursor-pointer">水平翻轉</label>
                    </div>
                  </div>
                </div>

                {/* ── 右側立繪 ── */}
                <div className="border border-wiki-border rounded-lg p-4">
                  <h3 className="text-wiki-text text-sm font-bold mb-3">右側立繪</h3>
                  <ImageUploadInput
                    label="右側圖片"
                    value={bgRightUrl}
                    position="50% 50%"
                    onChange={setBgRightUrl}
                    onPositionChange={() => {}}
                    previewHeight="h-48"
                  />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-wiki-text-muted text-xs mb-1">透明度 {Math.round(bgRightOpacity * 100)}%</label>
                      <input type="range" min="0.1" max="1" step="0.05"
                        value={bgRightOpacity} onChange={e => setBgRightOpacity(parseFloat(e.target.value))}
                        className="w-full accent-wiki-accent" />
                    </div>
                    <div>
                      <label className="block text-wiki-text-muted text-xs mb-1">縮放 {bgRightScale.toFixed(2)}x</label>
                      <input type="range" min="0.5" max="2" step="0.05"
                        value={bgRightScale} onChange={e => setBgRightScale(parseFloat(e.target.value))}
                        className="w-full accent-wiki-accent" />
                    </div>
                    <div>
                      <label className="block text-wiki-text-muted text-xs mb-1">垂直偏移 {bgRightOffsetY}px</label>
                      <input type="range" min="-300" max="300" step="10"
                        value={bgRightOffsetY} onChange={e => setBgRightOffsetY(parseInt(e.target.value))}
                        className="w-full accent-wiki-accent" />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input type="checkbox" id="bgRightFlip" checked={bgRightFlip}
                        onChange={e => setBgRightFlip(e.target.checked)}
                        className="accent-wiki-accent w-4 h-4" />
                      <label htmlFor="bgRightFlip" className="text-wiki-text-muted text-xs cursor-pointer">水平翻轉</label>
                    </div>
                  </div>
                </div>

                <p className="text-wiki-text-muted text-xs">立繪僅在超寬屏（xl, 1280px+）顯示，不影響手機和平板佈局。</p>
              </div>
            )}
          </div>

          {/* 保存按鈕 */}
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
