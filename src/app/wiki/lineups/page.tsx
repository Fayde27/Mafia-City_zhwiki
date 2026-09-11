'use client'

export const runtime = 'edge'

import { Suspense } from 'react'
import LineupWikiApp from '@/components/LineupWikiApp'

// 陣容搭配（單一入口，內含豪傑 / 英雄 切換）
// LineupWikiApp 用了 useSearchParams（?lineup= 深連結），必須包 Suspense
export default function LineupsWikiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-wiki-bg flex items-center justify-center text-wiki-text-muted">載入中...</div>
    }>
      <LineupWikiApp />
    </Suspense>
  )
}
