'use client'

import { useState, useMemo } from 'react'
import { VILLA3637_BUILDINGS, GP_PACK, LP_PACK } from '@/data/calculators/villa-3637'

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
const MINLV = 45, MAXLV = 55

export default function Villa3637Calculator() {
  const [rows, setRows] = useState(() =>
    VILLA3637_BUILDINGS.map(b => ({ cur: 45, tgt: 45, qty: b.defaultQty }))
  )

  const set = (i: number, key: 'cur' | 'tgt' | 'qty', v: number) => {
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      if (key === 'qty') return { ...r, qty: Math.max(0, v || 0) }
      return { ...r, [key]: Math.min(MAXLV, Math.max(MINLV, v || MINLV)) }
    }))
  }

  const result = useMemo(() => {
    const t = { wu: 0, cash: 0, arm: 0, alloy: 0, gp: 0, lp: 0 }
    VILLA3637_BUILDINGS.forEach((b, i) => {
      const { cur, tgt, qty } = rows[i]
      if (tgt <= cur || qty <= 0) return
      b.rows.forEach(([lvl, wu, cash, arm, alloy, gp, lp]) => {
        if (lvl > cur && lvl <= tgt) {
          t.wu += qty * wu; t.cash += qty * cash; t.arm += qty * arm
          t.alloy += qty * alloy; t.gp += qty * gp; t.lp += qty * lp
        }
      })
    })
    const gpFr = [t.wu / GP_PACK.wu, t.cash / GP_PACK.cash, t.arm / GP_PACK.arm, t.alloy / GP_PACK.alloy, t.gp / GP_PACK.gp]
    const gpPacks = Math.max(0, Math.ceil(Math.max(...gpFr)))
    const lpPacks = Math.max(0, Math.ceil(t.lp / LP_PACK.lp))
    return { t, gpPacks, lpPacks }
  }, [rows])

  const inCls = 'w-14 bg-wiki-gray border border-wiki-border rounded px-1.5 py-1.5 text-center text-wiki-text text-sm focus:border-wiki-accent focus:outline-none'
  const cards: [string, number][] = [
    ['物資', result.t.wu], ['現金', result.t.cash], ['軍火', result.t.arm],
    ['合金', result.t.alloy], ['教父圖紙', result.t.gp], ['傳奇圖紙', result.t.lp],
  ]

  return (
    <div className="space-y-6">
      <p className="text-wiki-text-muted text-xs">
        別墅 36→37 級（內部對應 46~55 級）升級資源、教父圖紙與傳奇圖紙需求。等級範圍 45~55，可設各建築數量。
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(([label, v]) => (
          <div key={label} className="bg-wiki-gray-light border border-wiki-border rounded-lg p-3 text-center">
            <div className="text-wiki-text-muted text-xs mb-1">{label}</div>
            <div className="text-sm font-bold text-wiki-text break-all">{fmt(v)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-wiki-accent/10 border-2 border-wiki-accent rounded-lg p-4 text-center">
          <div className="text-wiki-accent text-xs mb-1">需要「教父圖紙禮包」</div>
          <div className="text-2xl font-bold text-wiki-accent">{fmt(result.gpPacks)} 個</div>
        </div>
        <div className="bg-wiki-accent/10 border-2 border-wiki-accent rounded-lg p-4 text-center">
          <div className="text-wiki-accent text-xs mb-1">需要「傳奇圖紙禮包」</div>
          <div className="text-2xl font-bold text-wiki-accent">{fmt(result.lpPacks)} 個</div>
        </div>
      </div>
      <p className="text-wiki-text-muted text-xs">
        教父圖紙禮包 = 資源與教父圖紙各項（需求÷含量）取最大值向上取整（每包 物資/現金各 68,000,000、軍火 1,288,000、合金 322,000、教父圖紙 1,200）。傳奇圖紙禮包 = 傳奇圖紙需求 ÷ 600 向上取整。
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-wiki-accent text-xs uppercase tracking-wider">
              <th className="text-left px-2 py-2">建築</th>
              <th className="px-2 py-2">數量</th>
              <th className="px-2 py-2">當前</th>
              <th className="px-2 py-2">目標</th>
            </tr>
          </thead>
          <tbody>
            {VILLA3637_BUILDINGS.map((b, i) => (
              <tr key={b.name} className="border-t border-wiki-border">
                <td className="px-2 py-2 text-wiki-text font-bold whitespace-nowrap">{b.name}</td>
                <td className="px-2 py-2 text-center">
                  <input type="number" min={0} value={rows[i].qty}
                    onChange={e => set(i, 'qty', parseInt(e.target.value))} className={inCls} />
                </td>
                <td className="px-2 py-2 text-center">
                  <input type="number" min={MINLV} max={MAXLV} value={rows[i].cur}
                    onChange={e => set(i, 'cur', parseInt(e.target.value))} className={inCls} />
                </td>
                <td className="px-2 py-2 text-center">
                  <input type="number" min={MINLV} max={MAXLV} value={rows[i].tgt}
                    onChange={e => set(i, 'tgt', parseInt(e.target.value))} className={inCls} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-wiki-text-muted text-xs">當前 ≥ 目標 或 數量 0 的建築不計入。「身上已有資源扣減 / 黑道豪門搭配」暫未納入，後續細化。</p>
    </div>
  )
}
