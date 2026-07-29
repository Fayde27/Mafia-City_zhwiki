'use client'

export const runtime = 'edge'

import LineupWikiApp from '@/components/LineupWikiApp'

// 陣容搭配（單一入口，內含豪傑 / 英雄 切換）
export default function LineupsWikiPage() {
  return <LineupWikiApp />
}
