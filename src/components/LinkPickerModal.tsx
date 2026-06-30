'use client'

import { useEffect, useRef, useState } from 'react'

interface SearchResult {
  type: string
  id: string
  name: string
  url: string
  category: string
  icon: string
}

const TABS: { key: string; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'article', label: '文章' },
  { key: 'character', label: '角色' },
  { key: 'building', label: '建築' },
  { key: 'item', label: '道具' },
  { key: 'equipment', label: '裝備' },
  { key: 'troop', label: '兵種' },
]

interface LinkPickerModalProps {
  open: boolean
  onClose: () => void
  /** 確認連結。label 為條目名稱（未選取文字時用作插入文本） */
  onConfirm: (url: string, label?: string) => void
}

export default function LinkPickerModal({ open, onClose, onConfirm }: LinkPickerModalProps) {
  const [tab, setTab] = useState('')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ESC 關閉
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 打開時重置 + 聚焦
  useEffect(() => {
    if (open) {
      setQ(''); setResults([]); setManualUrl(''); setTab('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // 搜索（防抖）
  useEffect(() => {
    if (!open) return
    const kw = q.trim()
    if (!kw) { setResults([]); return }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: kw })
        if (tab) params.set('type', tab)
        const res = await fetch(`/api/wiki/search?${params.toString()}`)
        const data = await res.json()
        setResults(data.results || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [q, tab, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[10vh]"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-wiki-card border border-wiki-border rounded-xl shadow-2xl overflow-hidden">
        {/* 頭部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-wiki-border">
          <h3 className="text-wiki-text font-bold text-sm">插入連結</h3>
          <button type="button" onClick={onClose} className="text-wiki-text-muted hover:text-wiki-text text-lg leading-none">×</button>
        </div>

        {/* 站內條目搜索 */}
        <div className="p-4 space-y-3">
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜索站內條目（文章 / 角色 / 建築 / 道具 / 裝備 / 兵種）"
            className="w-full bg-wiki-gray border border-wiki-border rounded px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
          />

          {/* 類型 Tab */}
          <div className="flex flex-wrap gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${tab === t.key ? 'bg-wiki-accent text-wiki-darker font-bold' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 結果列表 */}
          <div className="max-h-64 overflow-y-auto border border-wiki-border rounded divide-y divide-wiki-border">
            {loading && <p className="text-wiki-text-muted text-xs text-center py-6">搜索中…</p>}
            {!loading && q.trim() && results.length === 0 && (
              <p className="text-wiki-text-muted text-xs text-center py-6">無匹配條目</p>
            )}
            {!loading && !q.trim() && (
              <p className="text-wiki-text-muted text-xs text-center py-6">輸入關鍵字以搜索條目</p>
            )}
            {results.map(r => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => onConfirm(r.url, r.name)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-wiki-gray transition-colors"
              >
                <div className="w-8 h-8 rounded bg-wiki-gray-light border border-wiki-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {r.icon
                    ? <img src={r.icon} alt="" className="w-full h-full object-contain" />
                    : <span className="text-wiki-text-muted text-[9px]">無圖</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-wiki-text text-sm font-medium truncate">{r.name}</p>
                  <p className="text-wiki-text-muted text-[11px] truncate">{r.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 手動外鏈 */}
        <div className="px-4 pb-4 pt-1 border-t border-wiki-border">
          <p className="text-wiki-text-muted text-[11px] mb-1.5">或直接輸入外部連結 URL</p>
          <div className="flex gap-2">
            <input
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && manualUrl.trim()) { e.preventDefault(); onConfirm(manualUrl.trim()) } }}
              placeholder="https://..."
              className="flex-1 bg-wiki-gray border border-wiki-border rounded px-3 py-2 text-sm text-wiki-text focus:border-wiki-accent focus:outline-none"
            />
            <button
              type="button"
              disabled={!manualUrl.trim()}
              onClick={() => onConfirm(manualUrl.trim())}
              className="px-4 py-2 bg-wiki-accent text-wiki-darker text-sm font-bold rounded disabled:opacity-40 disabled:cursor-not-allowed"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
