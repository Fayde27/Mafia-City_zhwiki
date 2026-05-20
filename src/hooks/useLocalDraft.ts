'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * 本地草稿自動保存 Hook
 * @param key      localStorage 的鍵名（建議包含頁面類型和 ID）
 * @param data     當前表單資料
 * @param enabled  是否啟用（表單載入完成後才啟用，避免覆蓋舊草稿）
 */
export function useLocalDraft<T>(key: string, data: T, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  // 資料變動時防抖自動儲存
  useEffect(() => {
    if (!enabledRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }))
      } catch {}
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [key, data, enabled])

  /** 讀取草稿，返回資料與儲存時間 */
  const getDraft = useCallback((): { data: T; savedAt: number } | null => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }, [key])

  /** 清除草稿 */
  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key) } catch {}
  }, [key])

  return { getDraft, clearDraft }
}
