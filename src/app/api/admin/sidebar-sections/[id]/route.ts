export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('SidebarSection')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error || !data) return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { data: section, error } = await supabaseAdmin
      .from('SidebarSection')
      .update({
        name: data.name,
        slug: data.slug,
        icon: data.icon || '◆',
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      })
      .eq('id', params.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(section)
  } catch {
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('SidebarSection')
      .delete()
      .eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 })
  }
}
