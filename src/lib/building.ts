// 建築圖鑑共用常量

export type BuildingType = 'inner' | 'season' | 'event'

export const BUILDING_TYPE_LABELS: Record<string, string> = {
  inner: '內城建築',
  season: '賽季建築',
  event: '賽事建築',
}

export const BUILDING_TYPE_OPTIONS: BuildingType[] = ['inner', 'season', 'event']

// 賽季/賽事建築專屬「所屬」字段標籤（內城建築無此字段）
export const BUILDING_AFFILIATION_LABELS: Record<string, string> = {
  season: '所屬賽季',
  event: '所屬賽事',
}

// 是否為「賽季/賽事」類型（這兩類取消建築屬性與升級詳情，改用所屬文本）
export function isSeasonalBuilding(buildingType?: string): boolean {
  return buildingType === 'season' || buildingType === 'event'
}
