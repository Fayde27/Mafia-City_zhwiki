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

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.equipment.count({ where }),
    ])

    return NextResponse.json({
      equipment,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取装备列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const equip = await prisma.equipment.create({
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity || 3,
        type: data.type,
        slot: data.slot,
        attack: data.attack || 0,
        defense: data.defense || 0,
        hp: data.hp || 0,
        speed: data.speed || 0,
        skill: data.skill,
        description: data.description,
        stats: data.stats,
        enhancement: data.enhancement,
        acquisition: data.acquisition,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      },
      include: { category: true },
    })
    return NextResponse.json(equip, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建装备失败' }, { status: 500 })
  }
}
