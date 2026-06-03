export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: article, error } = await supabaseAdmin
      .from('Article')
      .select('*, Category(*)')
      .eq('id', params.id)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }
    const { Category, ...rest } = article as any
    return NextResponse.json({ ...rest, category: Category ?? null })
  } catch (error) {
    return NextResponse.json({ error: '獲取文章失敗' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, slug, content, summary, coverImage, coverImagePosition, thumbnailPosition, categoryId, tags, isPublished, isPinned, badges, sortOrder } = await request.json()
    const { data: article, error } = await supabaseAdmin
      .from('Article')
      .update({
        title,
        slug,
        content,
        summary,
        coverImage,
        coverImagePosition,
        thumbnailPosition: thumbnailPosition || "50% 50%",
        categoryId,
        tags,
        isPublished,
        isPinned,
        badges,
        sortOrder,
      })
      .eq('id', params.id)
      .select('*, Category(*)')
      .single()

    if (error) throw error
    const { Category, ...rest } = article as any
    return NextResponse.json({ ...rest, category: Category ?? null })
  } catch (error) {
    return NextResponse.json({ error: '更新文章失敗' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('Article')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '刪除文章失敗' }, { status: 500 })
  }
}