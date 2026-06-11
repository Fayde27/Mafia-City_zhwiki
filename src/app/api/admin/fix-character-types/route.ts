export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

async function isAdmin(req: Request) {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/admin_token=([^;]+)/)
  if (!match) return false
  const payload = await verifyToken(match[1])
  return payload?.role === 'admin'
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 1: 找出分類名含「豪」的所有 categoryId
  const { data: cats, error: catErr } = await supabaseAdmin
    .from('CharacterCategory')
    .select('id, name')
    .ilike('name', '%豪%')

  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 })

  const catIds = (cats || []).map((c: any) => c.id)
  if (!catIds.length) {
    return NextResponse.json({ message: '未找到含「豪」的分類，無需修復', updated: 0 })
  }

  // Step 2: 查出需要修復的角色（characterType 不是 haojie 的）
  const { data: toFix, error: queryErr } = await supabaseAdmin
    .from('Character')
    .select('id, name, characterType')
    .in('categoryId', catIds)
    .neq('characterType', 'haojie')

  if (queryErr) return NextResponse.json({ error: queryErr.message }, { status: 500 })

  if (!toFix || toFix.length === 0) {
    return NextResponse.json({ message: '所有豪杰角色的 characterType 已正確，無需修復', updated: 0 })
  }

  const fixIds = toFix.map((c: any) => c.id)

  // Step 3: 批量更新
  const { error: updateErr } = await supabaseAdmin
    .from('Character')
    .update({ characterType: 'haojie' })
    .in('id', fixIds)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({
    message: `修復完成`,
    updated: fixIds.length,
    categories: (cats || []).map((c: any) => c.name),
    fixedCharacters: toFix.map((c: any) => ({ id: c.id, name: c.name, oldType: c.characterType })),
  })
}
