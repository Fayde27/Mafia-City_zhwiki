// 陣容搭配共用常量與型別

export interface LineupHeroT { id: string; name: string; style?: string; imgUrl?: string; characterKind?: string; sortOrder?: number }
export interface LineupWeaponT { id: string; parentId?: string | null; displayName: string; variantLabel?: string; quality?: string; isExclusive?: boolean; exclusiveHeroId?: string | null; imgUrl?: string; attrs?: string[] | string; sortOrder?: number }
export interface LineupEmblemT { id: string; parentId?: string | null; displayName: string; variantLabel?: string; quality?: string; imgUrl?: string; attrs?: string[] | string; sortOrder?: number }
export interface LineupGenreT { id: string; name: string; color?: string; imgUrl?: string; sortOrder?: number }
export interface LineupSlotT { role: 'main' | 'sub1' | 'sub2'; heroId?: string; stat?: string; weaponId?: string; emblemId?: string }
export interface LineupT {
  id: string; title: string; slug?: string; characterKind?: string
  genreId?: string | null; bgUrl?: string; badgeIds?: string[] | string
  description?: string; slots?: LineupSlotT[] | string; updateText?: string
  isPinned?: boolean; isPublished?: boolean; sortOrder?: number
}

export interface BadgeT { id: string; name: string; imgUrl?: string; color?: string; bg?: string; builtIn?: boolean; builtInCls?: string }
export interface StyleIconT { id?: string; style: string; imgUrl?: string }
export interface StatIconT { key: string; imgUrl?: string }
export interface RoleLabelT { text: string; emoji?: string; imgUrl?: string }
export interface PageConfigT { eyebrow?: string; title?: string; showTime?: boolean; timeText?: string; showFilterBar?: boolean }

export interface LineupConfigT {
  styleNames?: Record<string, string>
  styleIcons?: StyleIconT[]
  statNames?: Record<string, string>
  statIcons?: StatIconT[]
  badges?: BadgeT[]
  roleLabels?: Record<string, RoleLabelT>
  pageConfig?: PageConfigT
}

// 品質 → 顏色 / 中文名（對應線下工具 QC / QL）
export const QUALITY_COLOR: Record<string, string> = {
  white: '#9ca3af', green: '#22c55e', blue: '#3b82f6',
  purple: '#a855f7', orange: '#f97316', gold: '#c4a35a',
}
export const QUALITY_LABEL: Record<string, string> = {
  white: '白', green: '綠', blue: '藍', purple: '紫', orange: '橙', gold: '金',
}
export const QUALITY_KEYS = ['white', 'green', 'blue', 'purple', 'orange', 'gold']

// 4 種風格
export const STYLE_KEYS = ['迅捷', '智謀', '無畏', '穩重']
export const STYLE_DEFAULT_ICON: Record<string, string> = { 迅捷: '⚡', 智謀: '🧠', 無畏: '🔥', 穩重: '🛡' }

// 5 軸加點
export const STAT_KEYS = ['force', 'skill', 'physique', 'defense', 'speed']
export const STAT_DEFAULT_NAME: Record<string, string> = { force: '力量', skill: '技術', physique: '體魄', defense: '防護', speed: '速度' }
export const STAT_DEFAULT_ICON: Record<string, string> = { force: '💪', skill: '🎯', physique: '🫀', defense: '🛡', speed: '💨' }
export const STAT_COLOR: Record<string, string> = { force: '#D4363A', skill: '#2196F3', physique: '#22c55e', defense: '#C9A227', speed: '#a855f7' }

export const ROLE_KEYS: Array<'main' | 'sub1' | 'sub2'> = ['main', 'sub1', 'sub2']
export const ROLE_DEFAULT_LABEL: Record<string, RoleLabelT> = {
  main: { text: '主力', emoji: '⚔️' }, sub1: { text: '輔助1', emoji: '🛡' }, sub2: { text: '輔助2', emoji: '🛡' },
}

// 內建標籤
export const BUILTIN_BADGES: BadgeT[] = [
  { id: 'b-hot', name: 'HOT', builtIn: true, builtInCls: 'badge-hot', color: '#fff' },
  { id: 'b-new', name: 'NEW', builtIn: true, builtInCls: 'badge-new', color: '#fff' },
  { id: 'b-rec', name: '推薦', builtIn: true, builtInCls: 'badge-recommend', color: '#000' },
]

// 標籤視覺樣式（對照線下工具的 badge-hot / badge-new / badge-recommend）
export function badgeStyle(b: BadgeT): Record<string, string> {
  if (b.builtInCls === 'badge-hot') return { background: 'linear-gradient(135deg,#D4363A,#8B0000)', color: '#fff' }
  if (b.builtInCls === 'badge-new') return { background: 'linear-gradient(135deg,#2196F3,#0D47A1)', color: '#fff' }
  if (b.builtInCls === 'badge-recommend') return { background: 'linear-gradient(135deg,#C9A227,#8B6914)', color: '#000' }
  return { background: b.bg || '#1A1408', color: b.color || '#C9A227', border: `1px solid ${b.color || '#C9A227'}55` }
}

// 安全解析 JSON 數組
export function parseArr<T = any>(raw: any, fallback: T[] = []): T[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : fallback } catch { return fallback } }
  return fallback
}

// 生成短 id（避免依賴 crypto）
export function uid(): string { return 'l' + Math.random().toString(36).slice(2, 9) }

// 預設配置
export function defaultConfig(): LineupConfigT {
  return {
    styleNames: Object.fromEntries(STYLE_KEYS.map(k => [k, k])),
    styleIcons: STYLE_KEYS.map(s => ({ style: s, imgUrl: '' })),
    statNames: { ...STAT_DEFAULT_NAME },
    statIcons: STAT_KEYS.map(k => ({ key: k, imgUrl: '' })),
    badges: [...BUILTIN_BADGES],
    roleLabels: { ...ROLE_DEFAULT_LABEL },
    pageConfig: { eyebrow: 'MAFIA CITY · TACTICAL GUIDE', title: '豪傑最強陣容', showTime: false, timeText: '', showFilterBar: true },
  }
}
