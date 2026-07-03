'use client'

export const runtime = 'edge'

import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import PackCalculator from '@/components/calculators/PackCalculator'
import { LUXURY_CAR } from '@/data/calculators/luxury-car'

export default function LuxuryCarPage() {
  const items = LUXURY_CAR.items.map(i => ({ name: i.name, value: i.points, note: i.note }))
  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/tools" className="hover:text-wiki-accent">遊戲工具</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">豪車點數計算器</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🏎️</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-wiki-accent heading-hard">豪車點數計算器</h1>
            <p className="text-wiki-text-muted text-sm mt-1">選擇目標豪車，計算所需豪車禮包數量</p>
          </div>
        </div>

        <div className="bg-wiki-card border border-wiki-border rounded-xl p-5 md:p-7">
          <PackCalculator
            items={items}
            packSize={LUXURY_CAR.packPoints}
            packName={LUXURY_CAR.packName}
            unit={LUXURY_CAR.unit}
            currentLabel="現有點數"
            valueLabel="總點數"
          />
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
