'use client'

export const runtime = 'edge'

import LineupAdminApp from '@/components/LineupAdminApp'

// 英雄陣容搭配後台（豪傑在 /admin/lineups）
export default function HeroLineupsAdminPage() {
  return <LineupAdminApp kind="hero" />
}
