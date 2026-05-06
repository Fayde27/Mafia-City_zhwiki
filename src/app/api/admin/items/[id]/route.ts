import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: { category: true },
    })
    if (!item) {
      return NextResponse.json({ error: '道具不存在' }, { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '获取道具失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity,
        type: data.type,
        quality: data.quality,
        stackable: data.stackable,
        effect: data.effect,
        description: data.description,
        usage: data.usage,
        recipe: data.recipe,
        source: data.source,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
      include: { category: true },
    })
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: '更新道具失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.item.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除道具失败' }, { status: 500 })
  }
}
