'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 路徑片段 → 中文標籤
const LABELS: Record<string, string> = {
  dashboard: '管理首頁',
  // 內容
  articles: '攻略文章',
  announcements: '全站公告',
  submissions: '攻略投稿',
  drafts: '草稿箱',
  // 圖鑑
  characters: '角色圖鑑',
  equipment: '裝備圖鑑',
  items: '道具圖鑑',
  troops: '兵種圖鑑',
  buildings: '建築圖鑑',
  haojie: '豪傑',
  'equipment-sets': '套裝管理',
  // 站點
  sidebar: '側邊欄',
  'sidebar-nav': '側邊欄導航',
  'sidebar-sections': '側邊欄分區',
  'banner-articles': '輪播 Banner',
  'site-config': '站點配置',
  categories: '分類管理',
  'wiki-categories': 'Wiki 分類',
  // 分類 / 篩選
  'building-categories': '建築分類',
  'item-categories': '道具分類',
  'equipment-categories': '裝備分類',
  'character-categories': '角色分類',
  'troop-categories': '兵種分類',
  'building-filters': '建築篩選',
  'item-filters': '道具篩選',
  'equipment-filters': '裝備篩選',
  'character-filters': '角色篩選',
  'troop-filters': '兵種篩選',
  // 動作
  new: '新增',
  edit: '編輯',
}

// 是否為「ID 片段」（cuid / uuid / 純數字等），這類不顯示成單獨層級
function isIdSegment(seg: string): boolean {
  return /^[0-9a-f]{16,}$/i.test(seg) || /^c[a-z0-9]{20,}$/i.test(seg) || /^[0-9a-f-]{30,}$/i.test(seg) || /^\d+$/.test(seg)
}

interface Crumb {
  label: string
  href?: string // 無 href = 當前頁 / 不可跳轉
}

export default function AdminBreadcrumb() {
  const pathname = usePathname() || ''

  // 登入頁與儀表盤本身不顯示麵包屑
  if (pathname === '/admin/login' || pathname === '/admin/dashboard' || pathname === '/admin') {
    return null
  }

  const parts = pathname.split('/').filter(Boolean) // e.g. ['admin','buildings','edit','<id>']
  if (parts[0] !== 'admin') return null

  const rest = parts.slice(1) // 去掉 'admin'
  const crumbs: Crumb[] = [{ label: '管理後台', href: '/admin/dashboard' }]

  // 第二層：頂級板塊（如 buildings），對應真實列表頁，可跳轉
  if (rest[0]) {
    crumbs.push({ label: LABELS[rest[0]] || rest[0], href: `/admin/${rest[0]}` })
  }

  // 其餘層級（haojie / edit / new / id…）：僅作展示，不可跳轉（這些子路徑多無獨立列表頁）
  for (const seg of rest.slice(1)) {
    if (isIdSegment(seg)) continue
    crumbs.push({ label: LABELS[seg] || seg })
  }

  // 最後一項永遠視為當前頁，去掉其 href
  if (crumbs.length > 0) crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label }

  return (
    <div className="bg-wiki-darker border-b border-wiki-border/20">
      <div className="container mx-auto px-4">
        <nav className="flex items-center flex-wrap gap-1 py-2 text-sm" aria-label="頁面路徑">
          <span className="text-wiki-text-muted/60 mr-1">📍</span>
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-wiki-text-muted/40 mx-0.5">/</span>}
                {c.href && !isLast ? (
                  <Link href={c.href} className="text-wiki-text-muted hover:text-wiki-accent transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-wiki-accent font-bold' : 'text-wiki-text-muted'}>
                    {c.label}
                  </span>
                )}
              </span>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
