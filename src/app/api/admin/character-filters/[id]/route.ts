import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const option = await prisma.characterFilterOption.update({
      where: { id: params.id },
      data: { sortOrder: data.sortOrder },
    })
    return NextResponse.json(option)
  } catch {
    return NextResponse.json({ error: '更新筛选选项失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.characterFilterOption.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除筛选选项失败' }, { status: 500 })
  }
}
