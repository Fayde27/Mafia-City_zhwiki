import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    const where: any = { isActive: true }
    if (section) {
      where.section = section
    }

    const items = await prisma.sidebarNav.findMany({
      where,
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}
