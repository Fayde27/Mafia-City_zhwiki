import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const slug = searchParams.get('slug')
    const search = searchParams.get('search')

    const where: any = { isPublished: true }
    if (category) {
      where.category = { slug: category }
    }
    if (slug) {
      where.slug = slug
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const characters = await prisma.character.findMany({
      where,
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
      include: { category: true },
    })

    return NextResponse.json({ characters })
  } catch (error) {
    return NextResponse.json({ error: '获取角色失败' }, { status: 500 })
  }
}
