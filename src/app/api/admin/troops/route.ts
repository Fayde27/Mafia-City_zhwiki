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

    const [troops, total] = await Promise.all([
      prisma.troop.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.troop.count({ where }),
    ])

    return NextResponse.json({
      troops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取兵种列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const troop = await prisma.troop.create({
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity || 3,
        type: data.type,
        attack: data.attack || 0,
        defense: data.defense || 0,
        hp: data.hp || 0,
        speed: data.speed || 0,
        counter: data.counter,
        weakness: data.weakness,
        description: data.description,
        stats: data.stats,
        skills: data.skills,
        training: data.training,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      },
      include: { category: true },
    })
    return NextResponse.json(troop, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建兵种失败' }, { status: 500 })
  }
}
