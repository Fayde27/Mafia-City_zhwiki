export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { title, content, gameId, category } = await request.json()

    if (!title?.trim() || !content?.trim() || !gameId?.trim()) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('Submission')
      .insert({
        title: title.trim(),
        content: content.trim(),
        gameId: gameId.trim(),
        category: category?.trim() || '',
        status: 'pending',
      })

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '提交失败，请稍后重试' }, { status: 500 })
  }
}
