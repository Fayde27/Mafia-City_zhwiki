// 圖鑑筛選系統共用配置（角色/建築/道具三模塊）
// 裝備模塊因按 equipType 歸屬，另見 src/lib/equipment.ts

export interface FilterFieldDef { field: string; label: string }

// 各模塊可筛字段（策展完整列表，非動態掃列）
export const MODULE_FILTER_FIELDS: Record<string, FilterFieldDef[]> = {
  character: [
    { field: 'rarity', label: '稀有度' },
    { field: 'troopType', label: '兵種' },
  ],
  building: [
    { field: 'rarity', label: '品質' },
    { field: 'type', label: '類型' },
    { field: 'affiliation', label: '陣營' },
  ],
  item: [
    { field: 'rarity', label: '品質' },
    { field: 'type', label: '類型' },
    { field: 'quality', label: '品階' },
  ],
}

export const moduleFieldLabel = (module: string, field: string) =>
  (MODULE_FILTER_FIELDS[module] || []).find(f => f.field === field)?.label || field

// 整數品質檔位（建築/道具，rarity 為 Int）：value 存數字字串，顯示顏色名
export const RARITY_INT_TIERS = [
  { value: '1', label: '白色' },
  { value: '2', label: '綠色' },
  { value: '3', label: '藍色' },
  { value: '4', label: '紫色' },
  { value: '5', label: '橙色' },
  { value: '6', label: '金色' },
]
const RARITY_INT_LABEL: Record<string, string> = Object.fromEntries(RARITY_INT_TIERS.map(t => [t.value, t.label]))

// 角色稀有度（rarity 為 String）
export const CHAR_RARITY_TIERS = [
  { value: '金', label: '金' },
  { value: '紫', label: '紫' },
  { value: '藍', label: '藍' },
]

// 後台「選項值」的標準全集（會再並上真實數據裡的值）
export const moduleValuePresets = (module: string, field: string): { value: string; label: string }[] => {
  if (field === 'rarity') return module === 'character' ? CHAR_RARITY_TIERS : RARITY_INT_TIERS
  return []
}

// 前台/後台顯示某個選項值的可讀標籤（整數品質 → 顏色名）
export const displayFilterValue = (module: string, field: string, value: string): string => {
  if (field === 'rarity' && module !== 'character') return RARITY_INT_LABEL[value] || value
  return value
}
