'use client'

export const runtime = 'edge'

import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'
import BuildingUpgradeCalculator from '@/components/calculators/BuildingUpgradeCalculator'

export default function BuildingUpgradePage() {
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
            <p className="text-wiki-text-muted text-sm mt-1">填入各建築當前與目標等級，計算所需資源與資源豪享禮包數量</p>
          </div>
        </div>

        <div className="bg-wiki-card border border-wiki-border rounded-xl p-5 md:p-7">
          <BuildingUpgradeCalculator />
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
