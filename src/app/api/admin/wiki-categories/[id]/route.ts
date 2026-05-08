import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const modelMap: Record<string, any> = {
  characters: 'characterCategory',
  buildings: 'buildingCategory',
  equipment: 'equipmentCategory',
  items: 'itemCategory',
  troops: 'troopCategory',
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const modelName = modelMap[type]

    if (!modelName) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 })
    }

    const { name, slug, description, icon, sortOrder } = await request.json()
    const category = await (prisma as any)[modelName].update({
      where: { id: params.id },
      data: { name, slug, description, icon, sortOrder },
    })
    return NextResponse.json(category)
  } catch (error) {
    console.error('更新分类失败:', error)
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'characters'
    const modelName = modelMap[type]

    if (!modelName) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 })
    }

    await (prisma as any)[modelName].delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除分类失败:', error)
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 })
  }
}
