'use client'

export const runtime = 'edge'

import { useState } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import BuildingUpgradeCalculator from '@/components/calculators/BuildingUpgradeCalculator'
import Villa3036Calculator from '@/components/calculators/Villa3036Calculator'
import Villa3637Calculator from '@/components/calculators/Villa3637Calculator'

type Tab = 'base' | 'v3036' | 'v3637'

export default function BuildingUpgradePage() {
  const [tab, setTab] = useState<Tab>('base')

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki/tools" className="hover:text-wiki-accent">遊戲工具</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">建築升級資源計算器</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🏗️</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-wiki-accent heading-hard">建築升級資源計算器</h1>
            <p className="text-wiki-text-muted text-sm mt-1">填入建築當前與目標等級，計算所需資源與禮包數量</p>
          </div>
        </div>

        {/* 頂層分表切換 */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([['base', '升級資源（30級前）'], ['v3036', '別墅 30-36 級（教父圖紙）'], ['v3637', '別墅 36-37 級（教父+傳奇圖紙）']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-bold whitespace-nowrap rounded transition-colors ${
                tab === t ? 'bg-wiki-accent text-wiki-darker' : 'bg-wiki-gray text-wiki-text-muted hover:text-wiki-text'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-wiki-card border border-wiki-border rounded-xl p-5 md:p-7">
          {tab === 'base' && <BuildingUpgradeCalculator />}
          {tab === 'v3036' && <Villa3036Calculator />}
          {tab === 'v3637' && <Villa3637Calculator />}
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
