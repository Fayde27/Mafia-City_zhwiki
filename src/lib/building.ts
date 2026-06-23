// 建築圖鑑共用常量

export type BuildingType = 'inner' | 'season' | 'event'

export const BUILDING_TYPE_LABELS: Record<string, string> = {
  inner: '內城建築',
  season: '賽季建築',
  event: '賽事建築',
}

export const BUILDING_TYPE_OPTIONS: BuildingType[] = ['inner', 'season', 'event']
