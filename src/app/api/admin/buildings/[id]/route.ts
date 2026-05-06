import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const building = await prisma.building.findUnique({
      where: { id: params.id },
      include: { category: true },
    })
    if (!building) {
      return NextResponse.json({ error: '建筑不存在' }, { status: 404 })
    }
    return NextResponse.json(building)
  } catch (error) {
    return NextResponse.json({ error: '获取建筑失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const building = await prisma.building.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity,
        type: data.type,
        function: data.function,
        level: data.level,
        maxLevel: data.maxLevel,
        cost: data.cost,
        production: data.production,
        description: data.description,
        details: data.details,
        upgradeInfo: data.upgradeInfo,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
      include: { category: true },
    })
    return NextResponse.json(building)
  } catch (error) {
    return NextResponse.json({ error: '更新建筑失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.building.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除建筑失败' }, { status: 500 })
  }
}
