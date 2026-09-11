import { jwtVerify } from 'jose'

/**
 * 這個請求是不是「已登入管理端的人」發出的 —— 用於把後台人員排除在數據之外。
 *
 * ⚠️ 為什麼不直接用 @/lib/auth 的 verifyToken：
 * auth.ts 在 **模組載入時** 就會 `throw`（JWT_SECRET 讀不到的話）。
 * 把它引進埋點路徑，等於讓「驗身份」的任何閃失都能把整個統計打死 ——
 * 而且是靜默的：前端 fetch 一律 .catch() 吞掉，看板只會顯示一片 0，
 * 沒有任何錯誤可查。
 *
 * 所以這裡自己做驗簽，而且刻意 **fail open**：
 * 判斷不出來就當作一般訪客照常計數。
 * 最壞情況是多算了後台自己的幾次瀏覽（數據略微偏高，可接受）；
 * 反過來 fail closed 的最壞情況是整站數據全部遺失，且不會有人發現。
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return false

    const cookie = request.headers.get('cookie') || ''
    const m = cookie.match(/(?:^|;\s*)admin-token=([^;]+)/)
    if (!m) return false

    const { payload } = await jwtVerify(
      decodeURIComponent(m[1]),
      new TextEncoder().encode(secret)
    )
    return (payload as { role?: string })?.role === 'admin'
  } catch {
    return false
  }
}
