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

    const [buildings, total] = await Promise.all([
      prisma.building.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.building.count({ where }),
    ])

    return NextResponse.json({
      buildings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取建筑列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const building = await prisma.building.create({
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity || 3,
        type: data.type,
        function: data.function,
        level: data.level || 1,
        maxLevel: data.maxLevel || 10,
        cost: data.cost,
        production: data.production,
        description: data.description,
        details: data.details,
        upgradeInfo: data.upgradeInfo,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      },
      include: { category: true },
    })
    return NextResponse.json(building, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建建筑失败' }, { status: 500 })
  }
}
