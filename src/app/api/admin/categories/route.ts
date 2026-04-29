import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, slug, description, icon, sortOrder } = await request.json()
    const category = await prisma.category.create({
      data: { name, slug, description, icon, sortOrder: sortOrder || 0 },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}
