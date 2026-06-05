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

    // 檢查檔案大小（Supabase Free 方案上限 50MB，Edge Runtime 記憶體約 128MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({
        error: `檔案過大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限為 50MB`
      }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    const timestamp = Date.now()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const safeName = file.name
      .replace(/\.[^.]+$/, '')           // 去掉副檔名
      .replace(/[^\x00-\x7F]/g, '')      // 去掉非 ASCII（中文等）
      .replace(/[^a-zA-Z0-9_-]/g, '_')  // 其餘特殊字符換底線
      .replace(/^_+|_+$/g, '')           // 去頭尾底線
      .slice(0, 60)                       // 截斷過長檔名
      || 'image'
    const fileName = `${timestamp}-${safeName}.${ext}`
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
