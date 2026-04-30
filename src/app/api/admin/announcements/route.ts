import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    const announcements = await prisma.announcement.findMany({
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
    const body = await request.json()
    const announcement = await prisma.announcement.create({
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
