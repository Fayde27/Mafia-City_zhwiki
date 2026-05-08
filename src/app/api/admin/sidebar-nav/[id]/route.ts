import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.sidebarNav.findUnique({
      where: { id: params.id },
    })
    if (!item) {
      return NextResponse.json({ error: '导航项不存在' }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '获取导航项失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const item = await prisma.sidebarNav.update({
      where: { id: params.id },
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
    return NextResponse.json({ error: '更新导航项失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sidebarNav.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除导航项失败' }, { status: 500 })
  }
}
