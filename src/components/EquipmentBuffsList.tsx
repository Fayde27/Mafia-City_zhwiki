'use client'

import { useState, useMemo } from 'react'
import type { BuffGroup } from '@/lib/equipment'

const INITIAL_COUNT = 5

interface Entry { group: string; name: string; value: string }

export default function EquipmentBuffsList({ buffs, title }: { buffs: BuffGroup[]; title: string }) {
  const [activeGroup, setActiveGroup] = useState<string>('全部')
  const [expanded, setExpanded] = useState(false)

  // 扁平化為詞條列表（保留所屬分類）
  const entries: Entry[] = useMemo(
    () => buffs.flatMap(g => g.items.filter(i => i.name || i.value).map(i => ({ group: g.group, name: i.name, value: i.value }))),
    [buffs]
  )

  // 有效分類（含詞條的分類）
  const groups = useMemo(() => buffs.filter(g => g.items.some(i => i.name || i.value)).map(g => g.group), [buffs])

  const filtered = activeGroup === '全部' ? entries : entries.filter(e => e.group === activeGroup)
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)
  const hasMore = filtered.length > INITIAL_COUNT

  const chipCls = (active: boolean) =>
    `px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
      active
        ? 'bg-wiki-accent text-wiki-darker border-wiki-accent'
        : 'bg-wiki-gray text-wiki-text-muted border-wiki-border hover:text-wiki-text'
    }`

  return (
    <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6">
      <h3 className="text-lg font-bold text-wiki-accent mb-4">{title}</h3>

      {/* 篩選分類 */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" className={chipCls(activeGroup === '全部')}
            onClick={() => { setActiveGroup('全部'); setExpanded(false) }}>
            全部
          </button>
          {groups.map(g => (
            <button key={g} type="button" className={chipCls(activeGroup === g)}
              onClick={() => { setActiveGroup(g); setExpanded(false) }}>
              {g}
            </button>
          ))}
        </div>
      )}

      {/* 詞條列表（展開後可上下滑動） */}
      {filtered.length === 0 ? (
        <p className="text-wiki-text-muted text-sm">暫無屬性</p>
      ) : (
        <div className={`rounded-lg border border-wiki-border divide-y divide-wiki-border/60 ${expanded ? 'max-h-80 overflow-y-auto' : ''}`}>
          {visible.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-wiki-gray/40">
              <div className="flex items-center gap-2 min-w-0">
                {activeGroup === '全部' && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-wiki-accent/15 text-wiki-accent font-bold flex-shrink-0">{e.group}</span>
                )}
                <span className="text-wiki-text text-sm truncate">{e.name || '—'}</span>
              </div>
              <span className="text-wiki-accent font-bold text-sm flex-shrink-0">{e.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 展開 / 收起 */}
      {hasMore && (
        <button type="button" onClick={() => setExpanded(v => !v)}
          className="w-full mt-3 flex items-center justify-center gap-1 py-2 text-sm font-bold text-wiki-accent hover:bg-wiki-accent/10 rounded transition-colors">
          {expanded ? '收起' : `展開全部（共 ${filtered.length} 條）`}
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </button>
      )}
    </div>
  )
}
