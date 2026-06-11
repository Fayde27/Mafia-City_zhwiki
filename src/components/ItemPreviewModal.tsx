'use client'

import { useEffect } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface ItemPreviewForm {
  name: string
  summary?: string
  icon: string
  iconPosition: string
  image: string
  imagePosition: string
  source?: string
  isPublished: boolean
  categoryId?: string
}

interface Props {
  form: ItemPreviewForm
  categoryName?: string
  onClose: () => void
}

export default function ItemPreviewModal({ form, categoryName, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const hasSource = !!form.source && form.source.replace(/<[^>]*>/g, '').trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-3xl bg-wiki-bg rounded-2xl shadow-2xl overflow-hidden">
        {/* 頂部工具欄 */}
        <div className="flex items-center justify-between px-5 py-3 bg-wiki-gray-light border-b border-wiki-border sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-wiki-accent text-sm font-bold">👁 Wiki 預覽效果</span>
            <span className="text-wiki-text-muted text-xs">（僅預覽，不影響已保存數據）</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-wiki-gray text-wiki-text-muted hover:bg-wiki-border hover:text-wiki-text transition-colors text-lg">
            ×
          </button>
        </div>

        <div className="p-5 md:p-7">
          {/* 麵包屑 */}
          <div className="text-sm text-wiki-text-muted mb-4">
            <span className="opacity-50">首頁 / 圖鑑 / 道具圖鑑</span>
            {categoryName && <><span className="mx-2">/</span><span className="opacity-50">{categoryName}</span></>}
            <span className="mx-2">/</span>
            <span className="text-wiki-text">{form.name || '（未填寫名稱）'}</span>
          </div>

          {/* Banner 大圖 */}
          {form.image ? (
            <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6">
              <img src={form.image} alt={form.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: form.imagePosition || '50% 50%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 md:bottom-6 md:left-7">
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-xl mb-1">
                  {form.name || '（道具名稱）'}
                </h1>
                {form.summary && <p className="text-white/80 text-sm">{form.summary}</p>}
              </div>
            </div>
          ) : (
            /* 無 Banner 時標題區 */
            <div className="flex items-center gap-4 mb-6">
              {form.icon ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                  <img src={form.icon} alt={form.name}
                    className="w-full h-full object-contain p-1"
                    style={{ objectPosition: form.iconPosition || '50% 50%' }} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-wiki-border bg-wiki-gray flex items-center justify-center flex-shrink-0">
                  <span className="text-wiki-text-muted text-xs">無圖標</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-wiki-text">{form.name || '（道具名稱）'}</h1>
                {form.summary && <p className="text-wiki-text-muted mt-1 text-sm">{form.summary}</p>}
              </div>
            </div>
          )}

          {/* 有 Banner 時，下方顯示小圖標 */}
          {form.image && form.icon && (
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-wiki-border bg-wiki-gray flex-shrink-0">
                <img src={form.icon} alt={form.name}
                  className="w-full h-full object-contain p-1"
                  style={{ objectPosition: form.iconPosition || '50% 50%' }} />
              </div>
            </div>
          )}

          {/* Tab 區（靜態展示） */}
          <div className="flex items-center gap-2 mb-4">
            <div className="px-4 py-2 text-sm font-bold rounded bg-wiki-accent text-wiki-darker">道具詳情</div>
            {hasSource && (
              <div className="px-4 py-2 text-sm font-bold rounded bg-wiki-gray text-wiki-text-muted">獲取途徑</div>
            )}
          </div>

          {/* 獲取途徑內容 */}
          {hasSource && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <h3 className="font-bold text-wiki-accent mb-3 text-sm uppercase tracking-wider">獲取途徑</h3>
              <MarkdownRenderer content={form.source!} />
            </div>
          )}

          {!hasSource && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <p className="text-wiki-text-muted text-sm">暫無道具詳情</p>
            </div>
          )}

          {/* 發佈狀態 */}
          <div className={`rounded-xl p-3 text-xs font-bold text-center mt-4 ${
            form.isPublished
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {form.isPublished ? '✓ 已發佈（公開可見）' : '◎ 草稿（暫不公開）'}
          </div>
        </div>
      </div>
    </div>
  )
}
