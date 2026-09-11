'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPage, trackVisit } from '@/lib/track'

/**
 * 全站模塊 PV 埋點。掛在 root layout 的 <body> 裡，
 * 路由一變就記一筆（App Router 的 client 導航不會重跑 layout，
 * 所以要靠 usePathname 當依賴）。
 *
 * 後台路徑由 toModuleKey() 過濾掉，不會統計。
 * 不做防刷（已拍板）：刷新一次即計一次，看趨勢不看絕對值。
 */
export default function PageViewTracker() {
  const pathname = usePathname()

  // 造訪次數：整個分頁的生命週期只記一次（後台路徑不算）
  useEffect(() => {
    if (pathname?.startsWith('/admin')) return
    trackVisit()
  }, [pathname])

  useEffect(() => {
    if (!pathname) return
    trackPage(pathname)
  }, [pathname])

  return null
}
