import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: params.id },
      include: { category: true },
    })
    if (!character) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    }
    return NextResponse.json(character)
  } catch (error) {
    return NextResponse.json({ error: '获取角色失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const character = await prisma.character.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        title: data.title,
        avatar: data.avatar,
        banner: data.banner,
        rarity: data.rarity,
        path: data.path,
        faction: data.faction,
        combatType: data.combatType,
        gender: data.gender,
        releaseDate: data.releaseDate,
        weapon: data.weapon,
        tags: data.tags,
        description: data.description,
        stats: data.stats,
        materials: data.materials,
        story: data.story,
        otherInfo: data.otherInfo,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
      include: { category: true },
    })
    return NextResponse.json(character)
  } catch (error) {
    return NextResponse.json({ error: '更新角色失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.character.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除角色失败' }, { status: 500 })
  }
}
