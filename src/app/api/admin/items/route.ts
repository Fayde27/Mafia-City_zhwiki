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

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      }),
      prisma.item.count({ where }),
    ])

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取道具列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const item = await prisma.item.create({
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        image: data.image,
        rarity: data.rarity || 3,
        type: data.type,
        quality: data.quality,
        stackable: data.stackable !== undefined ? data.stackable : true,
        effect: data.effect,
        description: data.description,
        usage: data.usage,
        recipe: data.recipe,
        source: data.source,
        categoryId: data.categoryId,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished || false,
      },
      include: { category: true },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建道具失败' }, { status: 500 })
  }
}
