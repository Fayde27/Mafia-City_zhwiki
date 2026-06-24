'use client'

import { useEffect } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { BUILDING_AFFILIATION_LABELS, isSeasonalBuilding } from '@/lib/building'

interface UpgradeTable { columns: string[]; rows: string[][] }

function parseUpgradeTable(raw?: string): UpgradeTable | null {
  if (!raw) return null
  try {
    const t = JSON.parse(raw) as UpgradeTable
    if (!t.columns?.length) return null
    return t
  } catch { return null }
}

interface BuildingPreviewForm {
  name: string
  buildingType?: string
  affiliation?: string
  summary?: string
  icon: string
  iconPosition: string
  image: string
  imagePosition: string
  type: string
  function: string
  unlockCondition: string
  description: string
  upgradeLevels: string
  isPublished: boolean
}

interface Props {
  form: BuildingPreviewForm
  categoryName?: string
  onClose: () => void
}

export default function BuildingPreviewModal({ form, categoryName, onClose }: Props) {
  // ESC 關閉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const seasonal = isSeasonalBuilding(form.buildingType)
  const upgradeTable = parseUpgradeTable(form.upgradeLevels)
  const hasUpgrade = !seasonal && upgradeTable && upgradeTable.rows.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-4xl bg-wiki-bg rounded-2xl shadow-2xl overflow-hidden">
        {/* 頂部工具欄 */}
        <div className="flex items-center justify-between px-5 py-3 bg-wiki-gray-light border-b border-wiki-border sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-wiki-accent text-sm font-bold">👁 Wiki 預覽效果</span>
            <span className="text-wiki-text-muted text-xs">（僅預覽，不影響已保存數據）</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-wiki-gray text-wiki-text-muted hover:bg-wiki-border hover:text-wiki-text transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* 預覽內容區 */}
        <div className="p-5 md:p-7">
          {/* 麵包屑 */}
          <div className="text-sm text-wiki-text-muted mb-4">
            <span className="opacity-50">首頁 / 圖鑑 / 建築圖鑑</span>
            {categoryName && <><span className="mx-2">/</span><span className="opacity-50">{categoryName}</span></>}
            <span className="mx-2">/</span>
            <span className="text-wiki-text">{form.name || '（未填寫名稱）'}</span>
          </div>

          {/* Banner 大圖 */}
          {form.image ? (
            <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6">
              <img
                src={form.image}
                alt={form.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: form.imagePosition || '50% 50%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 md:bottom-6 md:left-7">
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-xl">
                  {form.name || '（建築名稱）'}
                </h1>
                {form.function && (
                  <p className="text-white/80 text-sm mt-1">{form.function}</p>
                )}
              </div>
            </div>
          ) : (
            /* 無 Banner 時的標題區 */
            <div className="flex items-center gap-4 mb-6">
              {form.icon && (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-wiki-accent bg-wiki-gray flex-shrink-0">
                  <img src={form.icon} alt={form.name} className="w-full h-full object-cover"
                    style={{ objectPosition: form.iconPosition || '50% 50%' }} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-wiki-text">{form.name || '（建築名稱）'}</h1>
                {form.function && <p className="text-wiki-text-muted mt-0.5">{form.function}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 主內容 */}
            <div className="lg:col-span-2">
              {/* 圖標 + 簡短描述 */}
              {form.image && form.icon && (
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-wiki-border bg-wiki-gray flex-shrink-0">
                    <img src={form.icon} alt={form.name} className="w-full h-full object-cover"
                      style={{ objectPosition: form.iconPosition || '50% 50%' }} />
                  </div>
                  {form.summary && (
                    <p className="text-wiki-text-muted text-sm leading-relaxed">{form.summary}</p>
                  )}
                </div>
              )}
              {!form.image && form.summary && (
                <p className="text-wiki-text-muted text-sm mb-5">{form.summary}</p>
              )}

              {/* Tab 樣式（靜態展示） */}
              <div className="flex items-center gap-2 mb-4">
                <div className="px-4 py-2 text-sm font-bold rounded bg-wiki-accent text-wiki-darker">建築詳情</div>
                {hasUpgrade && (
                  <div className="px-4 py-2 text-sm font-bold rounded bg-wiki-gray text-wiki-text-muted">升級詳情</div>
                )}
              </div>

              {/* 詳細描述 */}
              <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5 mb-4">
                {form.description
                  ? <MarkdownRenderer content={form.description} />
                  : <p className="text-wiki-text-muted text-sm">暫無建築詳情</p>
                }
              </div>

              {/* 升級表格預覽 */}
              {hasUpgrade && (
                <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-5">
                  <h3 className="font-bold text-wiki-text mb-3">升級詳情</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          {upgradeTable!.columns.map((col, ci) => (
                            <th key={ci} className="text-left px-3 py-2 bg-wiki-gray text-wiki-accent font-bold border border-wiki-border whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {upgradeTable!.rows.map((row, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-wiki-card' : 'bg-wiki-gray/40'}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2 border border-wiki-border text-wiki-text whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 側邊欄：屬性卡片 */}
            <div className="space-y-4">
              <div className="bg-wiki-gray-light border border-wiki-border rounded-xl p-4">
                <h3 className="font-bold text-wiki-text mb-3 text-sm uppercase tracking-wider">{seasonal ? '建築信息' : '建築屬性'}</h3>
                <div className="space-y-2 text-sm">
                  {seasonal && (
                    <div className="flex justify-between gap-2">
                      <span className="text-wiki-text-muted shrink-0">{BUILDING_AFFILIATION_LABELS[form.buildingType || 'season']}</span>
                      <span className="text-wiki-text font-medium text-right">{form.affiliation || '（未填寫）'}</span>
                    </div>
                  )}
                  {!seasonal && form.type && (
                    <div className="flex justify-between">
                      <span className="text-wiki-text-muted">類型</span>
                      <span className="text-wiki-text font-medium">{form.type}</span>
                    </div>
                  )}
                  {!seasonal && form.function && (
                    <div className="flex justify-between">
                      <span className="text-wiki-text-muted">功能</span>
                      <span className="text-wiki-text font-medium">{form.function}</span>
                    </div>
                  )}
                  {!seasonal && form.unlockCondition && (
                    <div className="flex justify-between gap-2">
                      <span className="text-wiki-text-muted shrink-0">開放條件</span>
                      <span className="text-wiki-text font-medium text-right">{form.unlockCondition}</span>
                    </div>
                  )}
                  {!seasonal && !form.type && !form.function && !form.unlockCondition && (
                    <p className="text-wiki-text-muted text-xs">（未填寫屬性）</p>
                  )}
                </div>
              </div>

              {/* 發佈狀態提示 */}
              <div className={`rounded-xl p-3 text-xs font-bold text-center ${form.isPublished ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                {form.isPublished ? '✓ 已發佈（公開可見）' : '◎ 草稿（暫不公開）'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
