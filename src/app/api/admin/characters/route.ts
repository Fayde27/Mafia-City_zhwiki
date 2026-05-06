import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const skip = (page - 1) * limit

    const where: any = {}
    if (category) {
      where.category = { slug: category }
    }

    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.character.count({ where }),
    ])

    return NextResponse.json({
      characters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取角色列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const character = await prisma.character.create({
      data: {
        name: data.name,
        slug: data.slug,
        title: data.title,
        avatar: data.avatar,
        banner: data.banner,
        rarity: data.rarity || 5,
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
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      },
      include: { category: true },
    })
    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建角色失败' }, { status: 500 })
  }
}
