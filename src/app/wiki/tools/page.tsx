'use client'

export const runtime = 'edge'

import WikiHeader from '@/components/WikiHeader'
import WikiFooter from '@/components/WikiFooter'

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-wiki-bg">
      <WikiHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-wiki-text mb-4">
            <span className="text-wiki-accent">◆</span> 游戏工具
          </h1>
          <p className="text-wiki-text-muted text-sm">敬请期待，内容正在建设中...</p>
        </div>
      </main>
      <WikiFooter />
    </div>
  )
}
