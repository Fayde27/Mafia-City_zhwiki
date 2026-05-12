/**
 * 重置管理员密码脚本
 * 运行：npx tsx --env-file=.env scripts/reset-admin-password.ts
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少环境变量：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  console.error('请确保 .env 文件存在且包含这两个变量')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function hashPassword(password: string): Promise<string> {
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
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

async function main() {
  const password = 'admin123'
  console.log('正在生成密码 hash...')
  const hashedPassword = await hashPassword(password)
  console.log('Hash 前缀:', hashedPassword.substring(0, 30) + '...')

  // 先删除旧记录
  const { error: deleteError } = await supabaseAdmin
    .from('User')
    .delete()
    .eq('username', 'admin')

  if (deleteError) {
    console.error('删除旧用户失败:', deleteError)
  } else {
    console.log('已删除旧 admin 用户（如果存在）')
  }

  // 插入新记录
  const { data, error: insertError } = await supabaseAdmin
    .from('User')
    .insert({ username: 'admin', password: hashedPassword, role: 'admin' })
    .select()

  if (insertError) {
    console.error('❌ 创建用户失败:', insertError)
    process.exit(1)
  }

  console.log('✅ 管理员账号已重置')
  console.log('   用户名: admin')
  console.log('   密码: admin123')
  console.log('   用户ID:', data?.[0]?.id)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
