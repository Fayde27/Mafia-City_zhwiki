// 教父金幣計算器數據（來源：計算器 V4.0 教父7版）
// 每件裝備所需教父金幣總量；禮包每個提供的金幣數。
export interface CoinItem { name: string; coins: number }

export const GODFATHER_COIN = {
  packName: '尊貴教父',
  packCoins: 8400,
  unit: '金幣',
  items: [
    { name: '藍色外套', coins: 21600 },
    { name: '藍色匕首', coins: 28080 },
    { name: '藍色手槍', coins: 47520 },
    { name: '藍色手杖', coins: 125280 },
    { name: '紫色外套', coins: 64800 },
    { name: '紫色匕首', coins: 84240 },
    { name: '紫色手槍', coins: 142560 },
    { name: '紫色手杖', coins: 375840 },
    { name: '橙色外套', coins: 198000 },
    { name: '橙色匕首', coins: 257400 },
    { name: '橙色手槍', coins: 435600 },
    { name: '橙色手杖', coins: 1148400 },
    { name: '金色外套', coins: 585000 },
    { name: '金色匕首', coins: 760500 },
    { name: '金色手槍', coins: 1287000 },
    { name: '金色手杖', coins: 3393000 },
    { name: '金色手錶', coins: 5074419 },
  ] as CoinItem[],
}
