import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
      include: { category: true },
    })
    if (!equipment) {
      return NextResponse.json({ error: '装备不存在' }, { status: 404 })
    }
    return NextResponse.json(equipment)
  } catch (error) {
    return NextResponse.json({ error: '获取装备失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const equip = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity,
        type: data.type,
        slot: data.slot,
        attack: data.attack,
        defense: data.defense,
        hp: data.hp,
        speed: data.speed,
        skill: data.skill,
        description: data.description,
        stats: data.stats,
        enhancement: data.enhancement,
        acquisition: data.acquisition,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
      include: { category: true },
    })
    return NextResponse.json(equip)
  } catch (error) {
    return NextResponse.json({ error: '更新装备失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.equipment.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除装备失败' }, { status: 500 })
  }
}
