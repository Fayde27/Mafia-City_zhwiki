import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.buildingCategory.findMany({
      include: { _count: { select: { buildings: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: '获取建筑分类失败' }, { status: 500 })
  }
}
