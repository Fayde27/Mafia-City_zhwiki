import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')

    const where: any = { isPublished: true }
    if (category) {
      where.category = { slug: category }
    }
    if (slug) {
      where.slug = slug
    }

    const buildings = await prisma.building.findMany({
      where,
      include: { category: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ buildings })
  } catch {
    return NextResponse.json({ error: '获取建筑失败' }, { status: 500 })
  }
}
