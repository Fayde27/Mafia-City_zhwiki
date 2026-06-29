// 公開 API 共用的輸入清洗工具（純 JS，Edge 安全）

/**
 * 清洗搜索關鍵字，移除 PostgREST .or() 過濾串中的保留字符，
 * 防止過濾條件注入（如用逗號追加 OR 條件、用括號改寫分組、繞過 isPublished）。
 * 保留 % _ 等 ILIKE 通配符（屬正常搜索語義，無注入風險）。
 */
export function sanitizeSearch(input: string | null | undefined, maxLen = 60): string {
  if (!input) return ''
  return input
    .replace(/[,()"'\\:]/g, ' ') // 去掉逗號/括號/引號/反斜線/冒號等過濾語法字符
    .trim()
    .slice(0, maxLen)
}

/**
 * 將分頁 limit 夾在合理範圍內，防止爬蟲用超大 limit 一次性拖庫。
 */
export function clampLimit(input: string | null | undefined, fallback = 10, max = 50): number {
  const n = parseInt(input || '', 10)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(n, max)
}
