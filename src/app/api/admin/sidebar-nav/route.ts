import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    const where: any = {}
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

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const item = await prisma.sidebarNav.create({
      data: {
        section: data.section,
        label: data.label,
        icon: data.icon || null,
        href: data.href,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      },
    })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '创建导航项失败' }, { status: 500 })
  }
}
