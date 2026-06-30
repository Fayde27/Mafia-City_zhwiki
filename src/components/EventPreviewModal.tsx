'use client'

import { useEffect } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface EventPreviewForm {
  name: string
  summary?: string
  icon: string
  iconPosition: string
  image: string
  imagePosition: string
  condition?: string
  gameplay?: string
  rewards?: string
  isPublished: boolean
  categoryId?: string
}

interface Props {
  form: EventPreviewForm
  categoryName?: string
  relatedArticleTitles?: string[]
  onClose: () => void
}

const hasContent = (v?: string) => !!v && v.replace(/<[^>]*>/g, '').trim().length > 0

export default function EventPreviewModal({ form, categoryName, relatedArticleTitles = [], onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const sections: { title: string; content?: string }[] = [
    { title: '活動簡介', content: form.summary },
    { title: '參與條件', content: form.condition },
    { title: '活動玩法', content: form.gameplay },
    { title: '活動獎勵', content: form.rewards },
  ].filter(s => hasContent(s.content))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-3xl bg-wiki-bg rounded-2xl shadow-2xl overflow-hidden">
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
            <span className="opacity-50">首頁 / 活動一覽</span>
            {categoryName && <><span className="mx-2">/</span><span className="opacity-50">{categoryName}</span></>}
            <span className="mx-2">/</span>
            <span className="text-wiki-text">{form.name || '（未填寫名稱）'}</span>
          </div>

          {/* Banner 大圖 或 圖標標題 */}
          {form.image ? (
            <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6">
              <img src={form.image} alt={form.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: form.imagePosition || '50% 50%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 md:bottom-6 md:left-7">
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-xl mb-1">
                  {form.name || '（活動名稱）'}
                </h1>
                {form.summary && <p className="text-white/80 text-sm">{form.summary}</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-6">
              {form.icon ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                  <img src={form.icon} alt={form.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: form.iconPosition || '50% 50%' }} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-wiki-border bg-wiki-gray flex items-center justify-center flex-shrink-0">
                  <span className="text-wiki-text-muted text-xs">無圖標</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-wiki-text">{form.name || '（活動名稱）'}</h1>
                {form.summary && <p className="text-wiki-text-muted mt-1 text-sm">{form.summary}</p>}
              </div>
            </div>
          )}

          {sections.length === 0 && relatedArticleTitles.length === 0 && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <p className="text-wiki-text-muted text-sm">暫無活動詳情</p>
            </div>
          )}
          {sections.map(s => (
            <div key={s.title} className="bg-wiki-gray-light border border-wiki-border rounded-xl mb-4">
              <div className="px-5 py-3 border-b border-wiki-border">
                <h2 className="text-sm font-bold text-wiki-accent uppercase tracking-wider">{s.title}</h2>
              </div>
              <div className="px-5 py-4">
                <MarkdownRenderer content={s.content!} />
              </div>
            </div>
          ))}
          {relatedArticleTitles.length > 0 && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl mb-4">
              <div className="px-5 py-3 border-b border-wiki-border">
                <h2 className="text-sm font-bold text-wiki-accent uppercase tracking-wider">相關攻略</h2>
              </div>
              <ul className="px-5 py-4 space-y-2">
                {relatedArticleTitles.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-wiki-text text-sm">
                    <span className="text-wiki-accent">📄</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
