export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: item, error } = await supabaseAdmin.from('SidebarNav').select('*')
      .eq('id', params.id )
      .single()

    if (error) throw error
    if (!item) {
      return NextResponse.json({ error: '導航項不存在' }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '獲取導航項失敗' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: item, error } = await supabaseAdmin.from('SidebarNav').update({
        section: data.section,
        label: data.label,
        icon: data.icon || null,
        href: data.href || '',
        parentId: data.parentId || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      })
      .eq('id', params.id )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '更新導航項失敗' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('SidebarNav').delete()
      .eq('id', params.id )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '刪除導航項失敗' }, { status: 500 })
  }
}
