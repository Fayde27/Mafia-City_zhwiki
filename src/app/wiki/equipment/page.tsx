'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import Link from 'next/link'

interface EquipType {
  equipType: string
  label: string
  icon: string
  description: string
  count: number
}

export default function EquipmentWikiPage() {
  const [types, setTypes] = useState<EquipType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wiki/equipment/types')
      .then(res => res.json())
      .then(data => { setTypes(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-sm text-wiki-text-muted mb-4 md:mb-6">
          <Link href="/" className="hover:text-wiki-accent">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/wiki" className="hover:text-wiki-accent">圖鑑</Link>
          <span className="mx-2">/</span>
          <span className="text-wiki-text">裝備圖鑑</span>
        </div>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-wiki-accent heading-hard">裝備圖鑑</h1>
            <p className="text-wiki-text-muted text-sm mt-2">選擇裝備類型，查看詳細信息</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-wiki-text-muted">載入中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {types.map((t) => (
              <Link
                key={t.equipType}
                href={`/wiki/equipment/${t.equipType}`}
                className="bg-wiki-gray-light border border-wiki-border rounded-lg p-6 md:p-8 hover:border-wiki-accent transition-all group block"
              >
                <div className="text-4xl md:text-5xl mb-4">{t.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold text-wiki-text mb-2 group-hover:text-wiki-accent transition-colors">{t.label}</h3>
                <p className="text-wiki-text-muted text-sm mb-4 line-clamp-2">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-wiki-accent text-sm font-bold">{t.count} 件</span>
                  <span className="text-wiki-accent text-lg group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <WikiFooter />
    </div>
  )
}
