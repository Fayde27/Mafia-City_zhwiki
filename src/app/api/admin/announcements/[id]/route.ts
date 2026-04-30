import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    const db = getDb()
    const body = await request.json()
    const announcement = await db.announcement.update({
      where: { id: params.id },
      data: {
        title: body.title,
        content: body.content,
        type: body.type,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      },
    })
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    const db = getDb()
    await db.announcement.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
