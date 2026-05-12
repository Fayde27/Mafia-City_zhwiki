const fs = require('fs')
const path = require('path')

const MODEL_MAP = {
  announcement: 'Announcement',
  article: 'Article',
  category: 'Category',
  character: 'Character',
  characterCategory: 'CharacterCategory',
  characterFilter: 'CharacterFilter',
  building: 'Building',
  buildingCategory: 'BuildingCategory',
  buildingFilter: 'BuildingFilter',
  equipment: 'Equipment',
  equipmentCategory: 'EquipmentCategory',
  equipmentFilter: 'EquipmentFilter',
  item: 'Item',
  itemCategory: 'ItemCategory',
  itemFilter: 'ItemFilter',
  troop: 'Troop',
  troopCategory: 'TroopCategory',
  troopFilter: 'TroopFilter',
  sidebarNav: 'SidebarNav',
  contentNav: 'ContentNav',
}

const CATEGORY_MAP = {
  character: 'CharacterCategory',
  building: 'BuildingCategory',
  equipment: 'EquipmentCategory',
  item: 'ItemCategory',
  troop: 'TroopCategory',
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')

  if (content.includes("from '@/lib/supabase'")) {
    return false
  }

  // 1. Replace import
  content = content.replace(
    "import { prisma } from '@/lib/prisma'",
    "import { supabaseAdmin } from '@/lib/supabase'"
  )

  // 2. Replace prisma.X.method patterns
  // prisma.X.findMany(...) -> supabaseAdmin.from('X').select('*')...
  // prisma.X.findUnique(...) -> supabaseAdmin.from('X').select('*').eq('id', ...).single()
  // prisma.X.create(...) -> supabaseAdmin.from('X').insert(...).select().single()
  // prisma.X.update(...) -> supabaseAdmin.from('X').update(...).eq('id', ...).select().single()
  // prisma.X.delete(...) -> supabaseAdmin.from('X').delete().eq('id', ...)
  // prisma.X.count(...) -> supabaseAdmin.from('X').select('*', { count: 'exact', head: true })

  // Replace prisma.X with supabaseAdmin.from('TableName')
  for (const [model, table] of Object.entries(MODEL_MAP)) {
    content = content.replace(
      new RegExp(`prisma\\.${model}\\.`, 'g'),
      `supabaseAdmin.from('${table}').`
    )
  }

  // Replace .findMany( with .select('*')
  content = content.replace(/\.findMany\(/g, ".select('*')\n    ")

  // Replace .findUnique({ where: { id: X } }) with .select('*').eq('id', X).single()
  content = content.replace(
    /\.findUnique\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\}\s*\}\)/g,
    ".select('*')\n      .eq('id', $1)\n      .single()"
  )

  // Replace .create({ data: { ... } }) with .insert({ ... }).select().single()
  content = content.replace(
    /\.create\(\{\s*data:\s*\{/g,
    ".insert({"
  )
  content = content.replace(
    /\}\s*\}\)/g,
    "})\n      .select()\n      .single()"
  )

  // Replace .update({ where: { id: X }, data: { ... } }) with .update({ ... }).eq('id', X).select().single()
  content = content.replace(
    /\.update\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\},\s*data:\s*\{/g,
    ".update({"
  )
  // Add .eq('id', X).select().single() after the closing of update data
  // This is tricky with regex, let me handle it differently

  // Replace .delete({ where: { id: X } }) with .delete().eq('id', X)
  content = content.replace(
    /\.delete\(\{\s*where:\s*\{\s*id:\s*([^}]+)\s*\}\s*\}\)/g,
    ".delete()\n      .eq('id', $1)"
  )

  // Replace .count({ ... }) with .select('*', { count: 'exact', head: true })
  content = content.replace(
    /\.count\(\{[^}]*\}\)/g,
    ".select('*', { count: 'exact', head: true })"
  )

  // Replace include: { category: true } with select pattern
  // This is complex, let me handle it per-model

  // Replace orderBy: { field: 'desc' } with .order('field', { ascending: false })
  content = content.replace(
    /orderBy:\s*\{\s*(\w+):\s*'desc'\s*\}/g,
    ".order('$1', { ascending: false })"
  )
  content = content.replace(
    /orderBy:\s*\{\s*(\w+):\s*'asc'\s*\}/g,
    ".order('$1', { ascending: true })"
  )

  // Replace skip: X, take: Y with .range(X, X + Y - 1)
  content = content.replace(
    /skip:\s*(\w+),\s*take:\s*(\w+)/g,
    "range($1, $1 + $2 - 1)"
  )

  // Replace const X = await prisma... with const { data: X, error } = await supabaseAdmin...
  content = content.replace(
    /const\s+(\w+)\s*=\s*await\s+supabaseAdmin/g,
    "const { data: $1, error } = await supabaseAdmin"
  )

  // Replace await prisma... with const { error } = await supabaseAdmin... (for delete)
  content = content.replace(
    /await\s+supabaseAdmin/g,
    "const { error } = await supabaseAdmin"
  )

  // Add error check after supabase calls
  content = content.replace(
    /\.single\(\)\s*\n\s*return/g,
    ".single()\n\n    if (error) throw error\n    return"
  )

  fs.writeFileSync(filePath, content, 'utf-8')
  return true
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)
  let count = 0
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      count += walkDir(fullPath)
    } else if (file === 'route.ts') {
      if (migrateFile(fullPath)) {
        console.log(`  ✓ ${path.relative(__dirname, fullPath)}`)
        count++
      }
    }
  }
  return count
}

const apiDir = path.join(__dirname, 'src', 'app', 'api')
console.log('Starting migration...\n')
const count = walkDir(apiDir)
console.log(`\nMigrated ${count} files.`)