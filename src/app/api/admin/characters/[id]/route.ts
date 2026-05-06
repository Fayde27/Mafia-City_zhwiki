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
        role: data.role,
        weapon: data.weapon,
        coreBonus: data.coreBonus,
        acquisition: data.acquisition,
        description: data.description,
        attributes: data.attributes,
        skills: data.skills,
        rumors: data.rumors,
        teamComp: data.teamComp,
        troopRec: data.troopRec,
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
