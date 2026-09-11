import type { Metadata, Viewport } from 'next'
import './globals.css'
import PageViewTracker from '@/components/PageViewTracker'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '黑道風雲 Wiki - 官方攻略站',
  description: '黑道風雲遊戲官方Wiki，提供最全面的遊戲攻略、角色圖鑑、任務指南',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        <PageViewTracker />
        {children}
      </body>
    </html>
  )
}
