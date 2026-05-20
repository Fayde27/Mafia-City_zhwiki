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

    // 檢查檔案大小（Edge Runtime 限制，建議 5MB 以內）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: `檔案過大（${(file.size / 1024 / 1024).toFixed(1)}MB），請壓縮後再上傳，建議 5MB 以內`
      }, { status: 413 })
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

    if (error) {
      const msg = error.message || String(error)
      return NextResponse.json({ error: `Supabase 上傳失敗：${msg}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('assets')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      name: file.name,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Upload error:', error)
    return NextResponse.json({ error: `上傳失敗：${msg}` }, { status: 500 })
  }
}
