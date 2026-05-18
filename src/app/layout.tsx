import type { Metadata } from 'next'
import './globals.css'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '黑道風雲 Wiki - 官方攻略站',
  description: '黑道風雲遊戲官方Wiki，提供最全面的遊戲攻略、角色圖鑑、任務指南',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
