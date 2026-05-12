export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { data: option, error } = await supabaseAdmin.from('CharacterFilterOption').update({
        sortOrder: data.sortOrder 
      })
      .eq('id', params.id )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(option)
  } catch {
    return NextResponse.json({ error: '更新筛选选项失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin.from('CharacterFilterOption').delete()
      .eq('id', params.id )
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除筛选选项失败' }, { status: 500 })
  }
}
