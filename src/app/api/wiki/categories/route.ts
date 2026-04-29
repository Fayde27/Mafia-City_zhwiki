import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { articles: { where: { isPublished: true } } },
        },
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}
