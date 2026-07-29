'use client'

export const runtime = 'edge'

import LineupAdminApp from '@/components/LineupAdminApp'

// 陣容搭配後台（單一入口，內含豪傑 / 英雄 切換）
export default function LineupsAdminPage() {
  return <LineupAdminApp />
}
