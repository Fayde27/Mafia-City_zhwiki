const opencc = require('opencc-js')
const fs = require('fs')
const path = require('path')

const converter = opencc.Converter({ from: 'cn', to: 'tw' })

// 专有名词保护：转换后强制替换回正确写法
const FIX_MAP = {
  '黑道風雲': '黑道風雲',   // 已是繁体，保护
  '登錄': '登入',            // 台湾习惯用"登入"
  '登陸': '登入',
  '鏈接': '連結',
  '超鏈接': '超連結',
  '點擊': '點擊',
  'Wiki': 'Wiki',
  'Slug': 'Slug',
  'slug': 'slug',
}

function convertFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8')
  let converted = converter(original)

  // 修正专有名词
  for (const [wrong, right] of Object.entries(FIX_MAP)) {
    converted = converted.split(wrong).join(right)
  }

  if (converted !== original) {
    fs.writeFileSync(filePath, converted, 'utf8')
    return true
  }
  return false
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let changed = 0
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      changed += walkDir(full)
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (convertFile(full)) {
        console.log('  converted:', full.replace(process.cwd() + path.sep, ''))
        changed++
      }
    }
  }
  return changed
}

console.log('开始转换...')
const total = walkDir(path.join(__dirname, '..', 'src'))
console.log(`\n完成！共修改 ${total} 个文件`)
