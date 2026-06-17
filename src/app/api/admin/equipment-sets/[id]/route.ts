export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: set, error } = await supabaseAdmin
      .from('EquipmentSet').select('*').eq('id', params.id).single()
    if (error || !set) return NextResponse.json({ error: '套裝不存在' }, { status: 404 })
    return NextResponse.json(set)
  } catch { return NextResponse.json({ error: '獲取套裝失敗' }, { status: 500 }) }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { data: set, error } = await supabaseAdmin
      .from('EquipmentSet').update({
        name: data.name,
        slug: data.slug,
        equipType: data.equipType,
        icon: data.icon,
        iconPosition: data.iconPosition,
        setBonus: data.setBonus,
        description: data.description,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .eq('id', params.id).select().single()
    if (error) throw error
    return NextResponse.json(set)
  } catch { return NextResponse.json({ error: '更新套裝失敗' }, { status: 500 }) }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // 先解除關聯該套裝的裝備（setId 置空），再刪套裝
    await supabaseAdmin.from('Equipment').update({ setId: null }).eq('setId', params.id)
    const { error } = await supabaseAdmin.from('EquipmentSet').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: '刪除套裝失敗' }, { status: 500 }) }
}
