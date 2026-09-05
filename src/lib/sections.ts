// 可屏蔽板塊（對外可見性開關）。管理員始終可見；公眾依 SiteConfig.sectionVisibility 決定。
// default 為「尚未在後台配置時」的預設對外狀態：新板塊上線先設 false，調整好後在後台開啟。
export interface GateableSection {
  key: string
  label: string
  href: string
  default: boolean
}

export const GATEABLE_SECTIONS: GateableSection[] = [
  { key: 'tools', label: '遊戲工具', href: '/wiki/tools', default: false },
  // 活動一覽：內容尚未整理完，先對外隱藏（管理員仍可見）；要開放到後台「站點配置」打開即可
  { key: 'events', label: '活動一覽', href: '/wiki/events', default: false },
]

// 解析 SiteConfig 的 sectionVisibility JSON 字串為 { key: boolean }
export function parseSectionVisibility(raw?: string | null): Record<string, boolean> {
  if (!raw) return {}
  try {
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

// 某板塊是否對外公開（未配置時回退到 default）
export function isSectionPublic(key: string, vis: Record<string, boolean>): boolean {
  if (key in vis) return !!vis[key]
  return GATEABLE_SECTIONS.find(s => s.key === key)?.default ?? true
}
