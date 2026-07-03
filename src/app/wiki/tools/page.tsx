'use client'

export const runtime = 'edge'

import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'

const TOOLS = [
  { slug: 'building-upgrade', icon: '🏗️', name: '建築升級資源計算器', desc: '填入各建築當前與目標等級，計算所需資源與資源豪享禮包數量' },
  { slug: 'godfather-coin', icon: '🪙', name: '教父金幣計算器', desc: '輸入現有金幣與目標裝備，算出還需金幣與尊貴教父禮包數量' },
  { slug: 'luxury-car', icon: '🏎️', name: '豪車點數計算器', desc: '輸入現有點數與目標豪車，算出還需點數與豪車禮包數量' },
]

export default function ToolsWikiPage() {
  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">遊戲工具</span>
        </div>

        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">遊戲工具</h1>
          <p className="text-wiki-text-muted text-sm mt-2">各類遊戲計算器，輔助規劃資源與禮包</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {TOOLS.map(t => (
            <Link key={t.slug} href={`/wiki/tools/${t.slug}`}
              className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 hover:border-wiki-accent transition-all group block">
              <div className="text-4xl mb-3">{t.icon}</div>
              <h3 className="text-lg font-bold text-wiki-text mb-2 group-hover:text-wiki-accent transition-colors">{t.name}</h3>
              <p className="text-wiki-text-muted text-sm leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
