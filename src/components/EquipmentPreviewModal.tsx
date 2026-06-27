'use client'

import { useEffect } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import {
  EQUIP_TYPE_LABELS, rarityInfo, parseBuffs, parseMainAttr,
} from '@/lib/equipment'

interface EquipPreviewForm {
  name: string
  summary?: string
  equipType: string
  icon: string
  iconPosition: string
  image: string
  imagePosition: string
  rarity: number
  type?: string        // 種類
  slot?: string        // 部位
  attrBias?: string    // 屬性偏向
  buffs?: string       // JSON
  mainAttr?: string    // 主屬性推薦詞條 JSON
  stats?: string       // 裝備屬性多行文本
  acquisition?: string // 富文本
  isPublished: boolean
}

interface Props {
  form: EquipPreviewForm
  setName?: string
  setBonus?: string
  onClose: () => void
}

const isHaojie = (t: string) => t === 'haojie_weapon' || t === 'haojie_warbadge'

export default function EquipmentPreviewModal({ form, setName, setBonus, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const rarity = rarityInfo(form.rarity)
  const buffs = parseBuffs(form.buffs).filter(g => g.items.some(i => i.name || i.value))
  const mainAttr = parseMainAttr(form.mainAttr)
  const mainItems = mainAttr.items.filter(i => i.name || i.value)
  const hasStats = !!form.stats && form.stats.trim().length > 0
  const hasAcq = !!form.acquisition && form.acquisition.replace(/<[^>]*>/g, '').trim().length > 0
  const typeLabel = EQUIP_TYPE_LABELS[form.equipType] || form.equipType

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-3xl bg-wiki-bg rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-wiki-gray-light border-b border-wiki-border sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-wiki-accent text-sm font-bold">👁 Wiki 預覽效果</span>
            <span className="text-wiki-text-muted text-xs">（{typeLabel}，僅預覽）</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-wiki-gray text-wiki-text-muted hover:bg-wiki-border hover:text-wiki-text transition-colors text-lg">×</button>
        </div>

        <div className="p-5 md:p-7">
          <div className="text-sm text-wiki-text-muted mb-4">
            <span className="opacity-50">首頁 / 圖鑑 / 裝備圖鑑 / {typeLabel}</span>
            <span className="mx-2">/</span>
            <span className="text-wiki-text">{form.name || '（未填寫名稱）'}</span>
          </div>

          {/* 標題區 */}
          {form.image ? (
            <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6">
              <img src={form.image} alt={form.name} className="w-full h-full object-cover" style={{ objectPosition: form.imagePosition || '50% 50%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 md:bottom-6 md:left-7">
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-xl mb-1">{form.name || '（裝備名稱）'}</h1>
                {form.summary && <p className="text-white/80 text-sm">{form.summary}</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-6">
              {form.icon ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0" style={{ borderColor: rarity.color }}>
                  <img src={form.icon} alt={form.name} className="w-full h-full object-cover" style={{ objectPosition: form.iconPosition || '50% 50%' }} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-wiki-border bg-wiki-gray flex items-center justify-center flex-shrink-0">
                  <span className="text-wiki-text-muted text-xs">無圖標</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-wiki-text">{form.name || '（裝備名稱）'}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 text-xs font-bold rounded text-white" style={{ backgroundColor: rarity.color }}>{rarity.label}</span>
                  {form.type && <span className="px-2 py-0.5 bg-wiki-accent/20 text-wiki-accent text-xs font-bold rounded">{form.type}</span>}
                  {form.slot && <span className="px-2 py-0.5 bg-wiki-gray text-wiki-text-muted text-xs font-bold rounded">{form.slot}</span>}
                </div>
                {form.summary && <p className="text-wiki-text-muted mt-1 text-sm">{form.summary}</p>}
              </div>
            </div>
          )}

          {/* 豪傑武器/戰徽：主屬性（推薦詞條） */}
          {isHaojie(form.equipType) && mainItems.length > 0 && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <h3 className="font-bold text-wiki-accent mb-1 text-sm uppercase tracking-wider">主屬性（推薦）</h3>
              {mainAttr.note && <p className="text-wiki-text-muted text-xs mb-3">{mainAttr.note}</p>}
              <div className="flex flex-wrap gap-2">
                {mainItems.map((it, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-wiki-gray rounded px-3 py-1.5 text-sm">
                    <span className="text-wiki-text-muted">{it.name}</span>
                    <span className="text-wiki-accent font-bold">{it.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 豪傑武器/戰徽：屬性分類 → 細分 */}
          {isHaojie(form.equipType) && buffs.length > 0 && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <h3 className="font-bold text-wiki-accent mb-3 text-sm uppercase tracking-wider">{form.equipType === 'haojie_weapon' ? '武器屬性' : '戰徽屬性'}</h3>
              <div className="space-y-3">
                {buffs.map((g, gi) => (
                  <div key={gi}>
                    <div className="text-wiki-text font-bold text-sm mb-1">{g.group}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {g.items.filter(i => i.name || i.value).map((it, ii) => (
                        <div key={ii} className="flex justify-between bg-wiki-gray rounded px-3 py-1.5 text-sm">
                          <span className="text-wiki-text-muted">{it.name}</span>
                          <span className="text-wiki-accent font-bold">{it.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 首領：屬性偏向 */}
          {form.equipType === 'leader' && form.attrBias && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <h3 className="font-bold text-wiki-accent mb-2 text-sm uppercase tracking-wider">屬性偏向</h3>
              <p className="text-wiki-text text-sm">{form.attrBias}</p>
            </div>
          )}

          {/* 首領/英雄：裝備屬性多行文本 */}
          {!isHaojie(form.equipType) && hasStats && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <h3 className="font-bold text-wiki-accent mb-2 text-sm uppercase tracking-wider">裝備屬性</h3>
              <p className="text-wiki-text text-sm whitespace-pre-line">{form.stats}</p>
            </div>
          )}

          {/* 套裝 */}
          {!isHaojie(form.equipType) && setName && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <h3 className="font-bold text-wiki-accent mb-2 text-sm uppercase tracking-wider">所屬套裝</h3>
              <div className="text-wiki-text font-bold mb-1">{setName}</div>
              {setBonus && <p className="text-wiki-text-muted text-sm whitespace-pre-line">{setBonus}</p>}
            </div>
          )}

          {/* 獲取途徑 */}
          {hasAcq && (
            <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
              <h3 className="font-bold text-wiki-accent mb-3 text-sm uppercase tracking-wider">獲取途徑</h3>
              <MarkdownRenderer content={form.acquisition!} />
            </div>
          )}

          <div className={`rounded-xl p-3 text-xs font-bold text-center mt-4 ${
            form.isPublished ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {form.isPublished ? '✓ 已發佈（公開可見）' : '◎ 草稿（暫不公開）'}
          </div>
        </div>
      </div>
    </div>
  )
}
