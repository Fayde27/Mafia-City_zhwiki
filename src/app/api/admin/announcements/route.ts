import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    const db = getDb()
    const announcements = await db.announcement.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(announcements)
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    const db = getDb()
    const body = await request.json()
    const announcement = await db.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type || 'info',
        isActive: body.isActive !== false,
        sortOrder: body.sortOrder || 0,
      },
    })
    return NextResponse.json(announcement)
  } catch (error) {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
