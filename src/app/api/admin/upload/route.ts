import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '沒有文件上傳' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name.replace(/\s/g, '_')}`
    const filePath = `uploads/${fileName}`

    const { error } = await supabaseAdmin.storage
      .from('assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('assets')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      name: file.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 })
  }
}
