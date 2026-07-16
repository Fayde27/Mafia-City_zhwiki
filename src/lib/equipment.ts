// 裝備圖鑑共用常量

export type EquipType = 'haojie_weapon' | 'haojie_warbadge' | 'leader' | 'hero'

export const EQUIP_TYPE_LABELS: Record<string, string> = {
  haojie_weapon: '豪傑武器',
  haojie_warbadge: '豪傑戰徽',
  leader: '首領裝備',
  hero: '英雄裝備',
}

// 品質：rarity Int → 顏色名 + 色值
export const RARITY_TIERS = [
  { value: 1, label: '白色', color: '#9ca3af' },
  { value: 2, label: '綠色', color: '#22c55e' },
  { value: 3, label: '藍色', color: '#3b82f6' },
  { value: 4, label: '紫色', color: '#a855f7' },
  { value: 5, label: '橙色', color: '#f97316' },
  { value: 6, label: '金色', color: '#c4a35a' },
]

// 豪傑武器/戰徽只開放高 4 檔（藍紫橙金）；其餘 6 檔全開
export const rarityTiersFor = (equipType: string) =>
  equipType.startsWith('haojie_') ? RARITY_TIERS.filter(t => t.value >= 3) : RARITY_TIERS

export const rarityInfo = (v: number) => RARITY_TIERS.find(t => t.value === v) || RARITY_TIERS[2]

// 部位選項（含枪械）
export const SLOT_OPTIONS: Record<string, string[]> = {
  leader: ['枪械', '武器', '飾品', '衣服', '褲子', '鞋子'],
  hero: ['枪械', '武器', '頭部', '衣服', '鞋子', '飾品'],
}

// 豪傑武器/戰徽：屬性分類桶（固定），桶內細分屬性可自由增刪
export const BUFF_GROUPS = ['加強暴徒', '加強飛車黨', '加強槍手', '加強改裝車輛', '出征上限', '豪傑']

export interface BuffItem { name: string; value: string }
export interface BuffGroup { group: string; items: BuffItem[] }

export const parseBuffs = (raw?: string | null): BuffGroup[] => {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch { return [] }
}

// 豪傑武器/戰徽「主屬性」：遊戲內隨機生成，Wiki 展示推薦詞條
export interface MainAttr { note: string; items: BuffItem[] }
export const DEFAULT_MAIN_ATTR: MainAttr = { note: '主屬性為遊戲內隨機生成，以下為推薦詞條', items: [] }

export const parseMainAttr = (raw?: string | null): MainAttr => {
  if (!raw) return { ...DEFAULT_MAIN_ATTR, items: [] }
  try {
    const v = JSON.parse(raw)
    return { note: typeof v?.note === 'string' ? v.note : '', items: Array.isArray(v?.items) ? v.items : [] }
  } catch { return { ...DEFAULT_MAIN_ATTR, items: [] } }
}

// 可篩選字段（後台篩選設定的預置下拉），按 equipType 決定可選字段
export interface FilterField { field: string; label: string }
export const FILTER_FIELDS: Record<string, FilterField[]> = {
  haojie_weapon:   [{ field: 'rarity', label: '品質' }, { field: 'type', label: '種類' }],
  haojie_warbadge: [{ field: 'rarity', label: '品質' }, { field: 'type', label: '種類' }],
  leader:          [{ field: 'rarity', label: '品質' }, { field: 'slot', label: '部位' }, { field: 'attrBias', label: '偏向' }, { field: 'type', label: '類型' }],
  hero:            [{ field: 'rarity', label: '品質' }, { field: 'slot', label: '部位' }, { field: 'type', label: '類型' }],
}
export const fieldLabel = (equipType: string, field: string) =>
  (FILTER_FIELDS[equipType] || []).find(f => f.field === field)?.label || field

// 種類選項（後台下拉可自由輸入，這裡給常見預設）
export const KIND_PRESETS: Record<string, string[]> = {
  haojie_weapon: ['殺人蜂', '執法者', '荒野獵人', '蜂蛇', '豪傑專用'],
  haojie_warbadge: ['幸運戰徽', '動力戰徽', '預限戰徽', '將領戰徽', '災厄戰徽'],
}

// 篩選「選項值」的標準全集（後台下拉候選，會再並上真實數據裡的值）
export const filterValuePresets = (equipType: string, field: string): { value: string; label: string }[] => {
  if (field === 'rarity') return rarityTiersFor(equipType).map(t => ({ value: String(t.value), label: t.label }))
  if (field === 'slot') return (SLOT_OPTIONS[equipType] || []).map(s => ({ value: s, label: s }))
  if (field === 'type') return (KIND_PRESETS[equipType] || []).map(s => ({ value: s, label: s }))
  return []
}
