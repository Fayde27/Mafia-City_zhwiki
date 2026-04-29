import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.article.count(),
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title, slug, content, summary, coverImage, categoryId, tags, isPublished, sortOrder } = await request.json()
    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        summary,
        coverImage,
        categoryId,
        tags,
        isPublished: isPublished || false,
        sortOrder: sortOrder || 0,
      },
      include: { category: true },
    })
    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 })
  }
}
