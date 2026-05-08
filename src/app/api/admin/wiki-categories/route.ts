import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const modelMap: Record<string, any> = {
  characters: 'characterCategory',
  buildings: 'buildingCategory',
  equipment: 'equipmentCategory',
  items: 'itemCategory',
  troops: 'troopCategory',
}

const countFieldMap: Record<string, string> = {
  characters: 'characters',
  buildings: 'buildings',
  equipment: 'equipment',
  items: 'items',
  troops: 'troops',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const modelName = modelMap[type]

    if (!modelName) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 })
    }

    const countField = countFieldMap[type]

    const categories = await (prisma as any)[modelName].findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { [countField]: true },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('获取分类失败:', error)
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const modelName = modelMap[type]

    if (!modelName) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 })
    }

    const { name, slug, description, icon, sortOrder } = await request.json()
    const category = await (prisma as any)[modelName].create({
      data: { name, slug, description, icon, sortOrder: sortOrder || 0 },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('创建分类失败:', error)
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}
