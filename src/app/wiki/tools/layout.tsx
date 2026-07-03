'use client'

import { useEffect, useState } from 'react'
import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { parseSectionVisibility, isSectionPublic } from '@/lib/sections'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoaded } = useAdminAuth()
  const [vis, setVis] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    fetch('/api/wiki/site-config')
      .then(r => r.json())
      .then(cfg => setVis(parseSectionVisibility(cfg?.sectionVisibility)))
      .catch(() => setVis({}))
  }, [])

  // 等配置與登入狀態都就緒，避免閃爍
  if (!isLoaded || vis === null) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <div className="text-center py-20 text-wiki-text-muted">載入中...</div>
        <WikiFooter />
      </div>
    )
  }

  const isPublic = isSectionPublic('tools', vis)

  // 未對外且非管理員 → 占位
  if (!isPublic && !isAdmin) {
    return (
      <div className="min-h-screen bg-wiki-bg">
        <WikiHeader />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-xl mx-auto text-center">
            <div className="text-5xl mb-4">🚧</div>
            <h1 className="text-2xl font-bold text-wiki-text mb-2">遊戲工具</h1>
            <p className="text-wiki-text-muted text-sm">敬請期待，內容正在建設中...</p>
          </div>
        </main>
        <WikiFooter />
      </div>
    )
  }

  // 管理員預覽未對外板塊時的提示條
  return (
    <>
      {isAdmin && !isPublic && (
        <div className="bg-yellow-500/15 border-b border-yellow-500/40 text-yellow-700 text-xs text-center py-2 px-4">
          ⚠️ 此板塊尚未對外，僅管理員可見。可到「後台 → 站點配置 → 板塊對外可見性」開啟。
        </div>
      )}
      {children}
    </>
  )
}
