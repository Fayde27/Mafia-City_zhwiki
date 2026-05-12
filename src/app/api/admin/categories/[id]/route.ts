export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: category, error } = await supabaseAdmin
      .from('Category')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }
    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, slug, description, icon, sortOrder } = await request.json()
    const { data: category, error } = await supabaseAdmin
      .from('Category')
      .update({ name, slug, description, icon, sortOrder })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: category, error: findError } = await supabaseAdmin
      .from('Category')
      .select('id')
      .eq('id', params.id)
      .single()

    if (findError || !category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('Category')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 })
  }
}