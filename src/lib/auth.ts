import { SignJWT, jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export interface TokenPayload {
  userId: string
  username: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [saltHex, originalHash] = hashedPassword.split(':')
  if (!saltHex || !originalHash) return false

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === originalHash
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

/**
 * 這個請求是不是「已登入管理端的人」發出的。
 * 用於埋點：後台人員自己瀏覽玩家端不該計入數據，看板要的是外網玩家的真實數據。
 *
 * 為什麼看 cookie 而不是前端的 localStorage：
 * admin-token 是 httpOnly，前端讀不到但同源 fetch 會自動帶上，
 * 在伺服器端驗簽才算數 —— localStorage 那個旗標是前端自己寫的，改一下就能偽造。
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookie = request.headers.get('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)admin-token=([^;]+)/)
  if (!m) return false
  const payload = await verifyToken(decodeURIComponent(m[1]))
  return payload?.role === 'admin'
}