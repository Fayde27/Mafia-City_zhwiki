import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    })
    if (!category) {
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
    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name, slug, description, icon, sortOrder },
    })
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
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { articles: true } } },
    })

    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    if (category._count.articles > 0) {
      await prisma.article.deleteMany({
        where: { categoryId: params.id },
      })
    }

    await prisma.category.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 })
  }
}
