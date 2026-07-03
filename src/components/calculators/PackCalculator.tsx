'use client'

import { useState } from 'react'

export interface PackItem { name: string; value: number; note?: string }

interface Props {
  items: PackItem[]
  packSize: number
  packName: string
  unit: string           // 「金幣」「點數」
  currentLabel: string   // 「現有金幣」
  valueLabel: string     // 「所需金幣」「總點數」
}

const fmt = (n: number) => n.toLocaleString('en-US')

export default function PackCalculator({ items, packSize, packName, unit, currentLabel, valueLabel }: Props) {
  const [targetName, setTargetName] = useState(items[0]?.name || '')
  const [current, setCurrent] = useState(0)

  const target = items.find(i => i.name === targetName)
  const total = target?.value ?? 0
  const needed = Math.max(0, total - (current || 0))
  const packs = Math.ceil(needed / packSize)
  const done = needed === 0

  const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none rounded'
  const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

  return (
    <div className="space-y-6">
      {/* 輸入區 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{currentLabel}</label>
          <input
            type="number" min={0} inputMode="numeric"
            value={current === 0 ? '' : current}
            onChange={e => setCurrent(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>目標</label>
          <select value={targetName} onChange={e => setTargetName(e.target.value)} className={inputCls + ' cursor-pointer'}>
            {items.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
          </select>
        </div>
      </div>

      {/* 目標效果備註 */}
      {target?.note && (
        <div className="bg-wiki-gray-light border border-wiki-border rounded-lg px-4 py-3 text-sm text-wiki-text-muted leading-relaxed">
          <span className="text-wiki-accent font-bold mr-1">效果</span>{target.note}
        </div>
      )}

      {/* 結果區 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 text-center">
          <div className="text-wiki-text-muted text-xs mb-1">{valueLabel}</div>
          <div className="text-xl font-bold text-wiki-text">{fmt(total)}</div>
        </div>
        <div className="bg-wiki-gray-light border border-wiki-border rounded-lg p-4 text-center">
          <div className="text-wiki-text-muted text-xs mb-1">還需{unit}</div>
          <div className="text-xl font-bold text-wiki-text">{fmt(needed)}</div>
        </div>
        <div className="bg-wiki-accent/10 border-2 border-wiki-accent rounded-lg p-4 text-center">
          <div className="text-wiki-accent text-xs mb-1">需要「{packName}」禮包</div>
          <div className="text-2xl font-bold text-wiki-accent">{done ? '已達成' : `${fmt(packs)} 個`}</div>
        </div>
      </div>

      <p className="text-wiki-text-muted text-xs">
        每個「{packName}」禮包提供 {fmt(packSize)} {unit}。禮包數 = 向上取整（還需{unit} ÷ {fmt(packSize)}）。
      </p>
    </div>
  )
}
