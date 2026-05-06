import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const options = await prisma.equipmentFilterOption.findMany({
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json(options)
  } catch {
    return NextResponse.json({ error: '获取筛选选项失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { type, value } = await request.json()
    if (!type || !value) {
      return NextResponse.json({ error: '类型和值不能为空' }, { status: 400 })
    }
    const option = await prisma.equipmentFilterOption.create({
      data: { type, value },
    })
    return NextResponse.json(option, { status: 201 })
  } catch {
    return NextResponse.json({ error: '创建筛选选项失败' }, { status: 500 })
  }
}
