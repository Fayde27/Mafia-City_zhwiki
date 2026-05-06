import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.equipmentCategory.findMany({
      include: { _count: { select: { equipment: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: '获取装备分类失败' }, { status: 500 })
  }
}
