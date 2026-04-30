import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: { category: true },
    })
    if (!article) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }
    return NextResponse.json(article)
  } catch (error) {
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, slug, content, summary, coverImage, categoryId, tags, isPublished, isPinned, badges, sortOrder } = await request.json()
    const article = await prisma.article.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        content,
        summary,
        coverImage,
        categoryId,
        tags,
        isPublished,
        isPinned,
        badges,
        sortOrder,
      },
      include: { category: true },
    })
    return NextResponse.json(article)
  } catch (error) {
    return NextResponse.json({ error: '更新文章失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.article.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除文章失败' }, { status: 500 })
  }
}
