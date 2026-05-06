import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const troop = await prisma.troop.findUnique({
      where: { id: params.id },
      include: { category: true },
    })
    if (!troop) {
      return NextResponse.json({ error: '兵种不存在' }, { status: 404 })
    }
    return NextResponse.json(troop)
  } catch (error) {
    return NextResponse.json({ error: '获取兵种失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const troop = await prisma.troop.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity,
        type: data.type,
        attack: data.attack,
        defense: data.defense,
        hp: data.hp,
        speed: data.speed,
        counter: data.counter,
        weakness: data.weakness,
        description: data.description,
        stats: data.stats,
        skills: data.skills,
        training: data.training,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
      include: { category: true },
    })
    return NextResponse.json(troop)
  } catch (error) {
    return NextResponse.json({ error: '更新兵种失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.troop.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除兵种失败' }, { status: 500 })
  }
}
