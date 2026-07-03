'use client'

import { useState, useMemo } from 'react'
import { BUILDINGS, PACK_CONTENT, LIMITED_5, RESOURCE_LABELS, VILLA_PREREQ } from '@/data/calculators/building-upgrade'

type Mode = 'all' | 'villa'

// 「只升別墅」場景：前置建築封頂到里程碑，返回計入的等級上限
function villaUpperBound(name: string, cur: number, target: number): number {
  const th = VILLA_PREREQ[name]
  if (!th) return target // 別墅/圍牆等不封頂
  let inc = 0
  if (th.length === 2) {
    const [t1, t2] = th
    inc = target < t1 ? 0 : target < t2 ? t1 - cur : t2 - cur
  } else {
    const [t1, t2, t3] = th
    inc = target < t1 ? 0 : target < t2 ? t1 - cur : target < t3 ? t2 - cur : t3 - cur
  }
  return cur + inc
}

type ResKey = 'wu' | 'cash' | 'arm' | 'alloy'
const RES_KEYS: ResKey[] = ['wu', 'cash', 'arm', 'alloy']
const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const MAXLV = 30

export default function BuildingUpgradeCalculator() {
  // 每個建築的 當前/目標 等級，預設 1/1（不升級）
  const [levels, setLevels] = useState(() => BUILDINGS.map(() => ({ cur: 1, tgt: 1 })))
  const [buyLimited, setBuyLimited] = useState(false)
  const [mode, setMode] = useState<Mode>('all')

  const set = (i: number, key: 'cur' | 'tgt', v: number) => {
    const val = Math.min(MAXLV, Math.max(1, v || 1))
    setLevels(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l))
  }

  const result = useMemo(() => {
    const totals = { wu: 0, cash: 0, arm: 0, alloy: 0 }
    BUILDINGS.forEach((b, i) => {
      const { cur, tgt } = levels[i]
      const upper = mode === 'villa' ? villaUpperBound(b.name, cur, tgt) : tgt
      if (upper <= cur) return
      b.rows.forEach(([lvl, wu, cash, arm, alloy]) => {
        if (lvl > cur && lvl <= upper) {
          totals.wu += wu; totals.cash += cash; totals.arm += arm; totals.alloy += alloy
        }
      })
    })
    // 各資源需要的資源包比例（買限購時先扣 5 個限定禮包量）
    const fractions = RES_KEYS.map(k => {
      const base = buyLimited ? Math.max(0, totals[k] - LIMITED_5[k]) : totals[k]
      return base / PACK_CONTENT[k]
    })
    const packs = Math.max(0, Math.ceil(Math.max(...fractions)))
    return { totals, fractions, packs }
  }, [levels, buyLimited, mode])

  const inputCls = 'w-16 bg-wiki-gray border border-wiki-border rounded px-2 py-1.5 text-center text-wiki-text text-sm focus:border-wiki-accent focus:outline-none'

  return (
    <div className="space-y-6">
      {/* 場景切換 */}
      <div className="flex gap-2">
        {([['all', '升級全部建築'], ['villa', '只升別墅（含前置）']] as [Mode, string][]).map(([m, label]) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${
              mode === m ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
            }`}>
            {label}
          </button>
        ))}
      </div>
      {mode === 'villa' && (
        <p className="text-wiki-text-muted text-xs -mt-3">
          只計算別墅、圍牆全程升級 + 各前置建築升到解鎖別墅所需的里程碑等級（超出目標的前置不計）。
        </p>
      )}

      {/* 結果區 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {RES_KEYS.map(k => (
          <div key={k} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-3 text-center">
            <div className="text-wiki-text-muted text-xs mb-1">{RESOURCE_LABELS[k]}</div>
            <div className="text-base font-bold text-wiki-text break-all">{fmt(result.totals[k])}</div>
          </div>
        ))}
      </div>
      <div className="bg-wiki-accent/10 border-2 border-wiki-accent rounded-lg p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-wiki-accent text-xs mb-1">需要「資源豪享禮包」</div>
          <div className="text-2xl font-bold text-wiki-accent">{fmt(result.packs)} 個</div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
          <span className="text-wiki-text-muted text-xs">先買 5 個限購包</span>
          <div onClick={() => setBuyLimited(v => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative ${buyLimited ? 'bg-wiki-accent' : 'bg-wiki-border'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${buyLimited ? 'left-6' : 'left-1'}`} />
          </div>
        </label>
      </div>
      <p className="text-wiki-text-muted text-xs">
        禮包數 = 各資源（需求量{buyLimited ? ' 扣除 5 個限購包量後' : ''} ÷ 每包含量）取最大值後向上取整。一個資源豪享禮包可覆蓋多種資源。
      </p>

      {/* 建築等級輸入 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-wiki-accent text-xs uppercase tracking-wider">
              <th className="text-left px-2 py-2">建築</th>
              <th className="px-2 py-2">當前等級</th>
              <th className="px-2 py-2">目標等級</th>
            </tr>
          </thead>
          <tbody>
            {BUILDINGS.map((b, i) => (
              <tr key={b.name} className="border-t border-wiki-border">
                <td className="px-2 py-2 text-wiki-text font-bold whitespace-nowrap">{b.name}</td>
                <td className="px-2 py-2 text-center">
                  <input type="number" min={1} max={MAXLV} value={levels[i].cur}
                    onChange={e => set(i, 'cur', parseInt(e.target.value))} className={inputCls} />
                </td>
                <td className="px-2 py-2 text-center">
                  <input type="number" min={1} max={MAXLV} value={levels[i].tgt}
                    onChange={e => set(i, 'tgt', parseInt(e.target.value))} className={inputCls} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-wiki-text-muted text-xs">當前等級 ≥ 目標等級的建築不計入。等級範圍 1~30。</p>
    </div>
  )
}
