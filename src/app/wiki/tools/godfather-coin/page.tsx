'use client'

export const runtime = 'edge'

import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import PackCalculator from '@/components/calculators/PackCalculator'
import { GODFATHER_COIN } from '@/data/calculators/godfather-coin'

export default function GodfatherCoinPage() {
  const items = GODFATHER_COIN.items.map(i => ({ name: i.name, value: i.coins }))
  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/tools" className="hover:text-wiki-accent">遊戲工具</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">教父金幣計算器</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🪙</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-wiki-accent heading-hard">教父金幣計算器</h1>
            <p className="text-wiki-text-muted text-sm mt-1">選擇目標裝備，計算所需尊貴教父禮包數量</p>
          </div>
        </div>

        <div className="bg-wiki-card border border-wiki-border rounded-xl p-5 md:p-7">
          <PackCalculator
            items={items}
            packSize={GODFATHER_COIN.packCoins}
            packName={GODFATHER_COIN.packName}
            unit={GODFATHER_COIN.unit}
            currentLabel="現有金幣"
            valueLabel="所需金幣"
          />
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
