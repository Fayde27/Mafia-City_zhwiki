# 黑道風雲 Wiki 攻略站 — 項目參考文檔

> 最後更新：2026-06-29

---

## 一、項目概覽

黑道風雲 / Mafia City 官方 Wiki 攻略站。兩個受眾共用同一個 Next.js app：

| 模塊 | 路徑 | 說明 |
|------|------|------|
| 後台 CMS | `/admin/*` | JWT cookie 鑒權，編輯所有內容 |
| 公開 Wiki | `/wiki/*` 及 `/` | 玩家瀏覽，無需登錄 |

**技術棧：** Next.js 14（App Router）· Tailwind CSS · Supabase PostgreSQL（生產）· Prisma + SQLite（本地遷移參考）· Supabase Storage（圖片）· jose JWT · TipTap 富文本 · Cloudflare Pages

---

## 二、硬性約束（必須遵守）

1. **所有 route 文件頂部必須加** `export const runtime = 'edge'`（Cloudflare Pages 要求，否則構建失敗）
2. **API 只用 `supabaseAdmin`**（`@/lib/supabase`），不在 runtime 用 Prisma Client（Edge 不支持）
3. **圖片文件名** 上傳前必須去除中文和特殊字符（只留英文、數字、`-`、`_`、`.`），否則 Supabase Storage 報 `Invalid key`
4. **Supabase 加新字段** 必須手動在 Supabase SQL Editor 執行 `ALTER TABLE`，再同步 `prisma/schema.prisma`，Prisma 遷移**不會**自動同步到生產庫
5. **JSON 字段**：DB 存字串，寫入 `JSON.stringify()`，讀取 `try { JSON.parse() } catch { fallback }`
6. **多對多更新**：用「刪舊插新」（先 DELETE，再 INSERT），不用 upsert

---

## 三、代碼慣例

**Admin 表單常用 class（直接複用）：**
```ts
const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'
```

**大型編輯頁佈局（標準範本）：**  
左側 Sticky 導航 + 右側分區表單 + scroll-spy 高亮（`offsetTop <= scrollY + 140`）+ 左側「👁 預覽效果」按鈕。  
→ 參考：`src/app/admin/buildings/edit/[id]/page.tsx`（所有大型編輯頁的標準範本）

**預覽 Modal 規範：**  
每個圖鑑有對應的 `XxxPreviewModal` 組件（`src/components/`），接收當前表單 state 實時渲染 Wiki 效果，ESC 關閉。  
→ 已實現：`BuildingPreviewModal.tsx` · `ItemPreviewModal.tsx` · `TroopPreviewModal.tsx` · `EquipmentPreviewModal.tsx`

**ImageUploadInput props：**
- `compact` — 圖標用，限寬 176px、預覽 144×144px 正方形
- `previewHeight` — Banner 用，如 `"h-48"`
- `objectFit` — `'cover'`（默認）或 `'contain'`

**顏色系統（Tailwind 自定義）：**
- `wiki-accent` `#c4a35a` — 金色主色調
- `wiki-bg` `#f5f5f0` — 頁面背景
- `wiki-card` `#ffffff` — 卡片背景
- `wiki-gray` `#e8e8e8` — 輸入框背景
- `wiki-text` `#1a1a1a` — 正文
- `wiki-danger` `#dc2626` — 危險/刪除

---

## 四、內容模塊結構

每個模塊通用形狀：`XxxCategory` + `Xxx` 主表 + `XxxFilterOption`

### 4-1 角色圖鑑（`Character` 表，`characterType` 區分）

| 類型 | characterType | API | 編輯頁 |
|------|--------------|-----|--------|
| 英雄 | `hero` | `/api/admin/characters` | `/admin/characters/edit/[id]` |
| 豪傑 | `haojie` | `/api/admin/haojie` | `/admin/characters/haojie/edit/[id]` |

後台統一入口：`/admin/characters`（三 Tab：全部 / 英雄 / 豪傑），編輯按鈕智能路由。

**英雄**：8 張關聯表（皮膚/羁绊/陣容/血盟/裝備/攻略）· 4 軸雷達圖（攻擊/防衛/統帥/速度）  
**豪傑**：全 JSON 字段 · 5 軸雷達圖（力量/技術/體魄/防護/速度，存 `attributes`）· 裝備存 `haojieEquip JSON({weapon,warbadge})` · `awakenHero` 布爾字段

**豪傑裝備推薦 UI**：使用 `EquipPickerField` 組件（搜索框 + 可滾動列表），按 `equipType` 過濾（`haojie_weapon` / `haojie_warbadge`），不用 grid checkbox。

**Wiki 角色卡片樣式**：`aspect-[3/4]` 立繪鋪滿，左側 4px 稀有度色條，底部黑色漸層 + 名字 + 星數，`objectPosition: '50% 20%'` 臉部居中。  
→ 參考：`src/app/wiki/characters/[slug]/page.tsx`

**常見坑：**
- 豪傑 `editLink` 判斷需同時檢查 `characterType==='haojie'` 和分類名含「豪」（舊數據 `characterType` 可能未正確設置）
- 修復工具：後台角色列表頁有「🔧 修復豪傑 characterType」按鈕，也可調用 `POST /api/admin/fix-character-types`

### 4-2 建築圖鑑（`Building` 表）✅ 完整

**字段：**
```
name / slug / categoryId / summary
icon / iconPosition / image（Banner）/ imagePosition
type / function / unlockCondition
description（富文本）/ upgradeLevels（JSON升級表格）
rarity / level / maxLevel / cost / production
sortOrder / isFeatured / isPublished / publishedAt
```

**升級表格 JSON 格式：**
```json
{ "columns": ["等級","升級條件","建造時間","效果加成"], "rows": [["1","總部Lv1","立即","容量500"]] }
```

**後台編輯頁** `/admin/buildings/edit/[id]`：6 分區 + 左側預覽按鈕  
**Wiki 詳情頁** 渲染升級表格為斑馬紋 HTML table，向後兼容舊 `upgradeInfo` 富文本

### 4-3 道具圖鑑（`Item` 表）✅ 完整

**字段：**
```
name / slug / categoryId / summary（簡介，列表卡片用）
icon / iconPosition / image（Banner，選填）/ imagePosition
source（獲取途徑，富文本，支持鏈接）
sortOrder / isFeatured / isPublished
-- 舊字段保留兼容：rarity / type / quality / stackable / effect / description / usage / recipe
```

**⚠️ 新字段需在 Supabase SQL Editor 執行（若尚未執行）：**
```sql
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "iconPosition" TEXT DEFAULT '50% 50%';
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "imagePosition" TEXT DEFAULT '50% 50%';
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;
```

**後台編輯頁** `/admin/items/edit/[id]`：4 分區（基本信息/圖片/獲取途徑/發佈設置）+ 預覽按鈕  
**Wiki 分類頁** `/wiki/items/[slug]`：方形圖標卡片網格，顯示圖片 + summary  
**Wiki 詳情頁** `/wiki/items/[slug]/[itemSlug]`：`summary` 在 Tabs 上方獨立顯示為「道具簡介」富文本模塊；Tabs 按有無內容動態顯示（兌換內容/道具詳情/獲取途徑/使用方法/合成配方）

### 4-4 裝備圖鑑（`Equipment` 表，`equipType` 區分）✅ 完整

**一張表四子類型**（仿角色 hero/haojie 模式），`equipType` ∈：
| 類型 | equipType | 專屬字段 |
|------|----------|---------|
| 豪傑武器 | `haojie_weapon` | type(種類) · buffs(分類→細分 JSON) |
| 豪傑戰徽 | `haojie_warbadge` | type(種類) · buffs(分類→細分 JSON) |
| 首領裝備 | `leader` | slot(部位) · attrBias(偏向) · stats(屬性文本) · setId |
| 英雄裝備 | `hero` | slot(部位) · stats(屬性文本) · setId |

**共用字段**：name/slug/summary/icon(+Position)/image(+Position)/rarity(品質,1白~6金，豪傑武器只開 3~6)/acquisition(富文本)/sortOrder/isFeatured/isPublished

**品質→顏色**：1白 2綠 3藍 4紫 5橙 6金（常量在 `src/lib/equipment.ts`）
**buffs JSON**：`[{ group:"加強暴徒", items:[{name,value}] }]`，分類桶固定（加強暴徒/飛車黨/槍手/改裝車輛/出征上限/豪傑），細分可增刪
**部位選項**：首領＝枪械/武器/飾品/衣服/褲子/鞋子；英雄＝枪械/武器/頭部/衣服/鞋子/飾品

**套裝**：獨立 `EquipmentSet` 表（`equipType` 區分 hero/leader），裝備經 `setId` 歸屬；套裝管理已整合進 `/admin/equipment` 第 4 Tab；前台詳情頁聚合「同套 N 件 + 套裝加成」

**後台**：統一列表 `/admin/equipment`（**4 主 Tab**：裝備列表/分類管理/篩選設定/套裝管理）· 裝備列表 Tab 內含 5 類型子篩選（全部/豪傑武器/豪傑戰徽/首領/英雄）· 新增頁選類型+名稱後跳編輯 · 編輯頁 `/admin/equipment/edit/[id]` 按 equipType 條件渲染分區 + `EquipmentPreviewModal`
**Wiki**：總覽 `/wiki/equipment`（4 類型卡）→ 列表 `/wiki/equipment/[equipType]`（品質色框方圖 + 篩選）→ 詳情 `/wiki/equipment/[equipType]/[slug]`
**公開 API**：`/api/wiki/equipment?equipType=` · `/api/wiki/equipment/types`（各類型計數）

> 武器圖鑑/戰徽圖鑑已併入此模塊；後續對接豪傑 `haojieEquip.weapon/.warbadge` 時直接引用對應 equipType 記錄。

### 4-5 兵種圖鑑（`Troop` 表）✅ 後台完整，Wiki 主列表已完成

**天賦字段格式**：`talent` 存 JSON 數組 `[{ icon: string; content: string }]`（icon 為圖片 URL，content 為富文本 HTML）。舊數據為 HTML 字串，讀取時用 `tryParseArr()` 做向後兼容（fallback 為 `[{ icon: '', content: html }]`）。

**後台編輯頁** `/admin/troops/edit/[id]`：天賦區為多行列表，每行含圖標上傳（點擊正方形觸發上傳）+ 富文本框 + 刪除按鈕，支持新增行。保存時將 `talents[]` 序列化為 `JSON.stringify(talents)` 寫入 `talent` 字段。

**Wiki 前台** `/wiki/troops`：單層主頁，雙層篩選（第一層：兵種類型 mobster/gunman/biker/vehicle；第二層：細分分類，只在多於 1 個時顯示）。原 `/wiki/troops/[slug]` 分類中間層已移除，訪問時重定向回 `/wiki/troops`。詳情頁路由不變：`/wiki/troops/[catSlug]/[troopSlug]`。

**troopType 值**：`mobster`(暴徒) · `gunman`(槍手) · `biker`(飛車黨) · `vehicle`(改裝車輛)

### 4-6 攻略文章（`Article` 表）✅ 完整

`isFeatured` · `isPinned` · `badges`（HOT/NEW 等逗號分隔）· `isPublished` · `sortOrder`  
富文本用 TipTap，支持圖片嵌入

### 4-7 首頁輪播 Banner ✅ 完整

數據流：後台 `/admin/banner-articles` → 保存到 `SiteConfig.bannerArticleIds`（JSON ID 數組）  
→ `/api/wiki/banner-articles` 按序返回文章 → 首頁 `HomeBannerCarousel` 消費  
fallback：未配置時取 `isFeatured=true` 的文章

---

## 五、路由地圖（摘要）

### 後台 `/admin/*`
```
/admin/login · /admin/dashboard
/admin/characters                     ← 英雄+豪傑統一列表（三Tab）
/admin/characters/edit/[id]
/admin/characters/haojie/edit/[id]
/admin/buildings · /admin/buildings/new · /admin/buildings/edit/[id]
/admin/items · /admin/items/new · /admin/items/edit/[id]   ← 完整
/admin/equipment                      ← 4 Tab：裝備列表/分類管理/篩選設定/套裝管理
/admin/troops · /admin/articles
/admin/announcements · /admin/categories · /admin/site-config
/admin/banner-articles                ← 首頁輪播文章管理
/admin/sidebar-nav · /admin/sidebar-sections · /admin/wiki-categories
/admin/character-filters · /admin/building-filters · /admin/equipment-filters
```

### 公開 Wiki `/wiki/*`
```
/                                     ← 首頁（搜索Banner + 輪播 + 熱門攻略 + 公告）
/wiki                                 ← 圖鑑總覽
/wiki/article/[slug]                  ← 文章詳情
/wiki/characters/[slug]/[characterSlug]       ← 英雄詳情
/wiki/buildings/[slug]/[buildingSlug]         ← 建築詳情
/wiki/items/[slug]/[itemSlug]                 ← 道具詳情
/wiki/equipment · /wiki/items                 ← 其他圖鑑
/wiki/troops                                  ← 兵種主列表（雙層篩選）
/wiki/troops/[catSlug]/[troopSlug]            ← 兵種詳情
/wiki/search · /wiki/rankings · /wiki/events · /wiki/submit
```

---

## 六、核心 API 一覽

### 後台 API（需 JWT cookie）
| 路徑 | 方法 | 說明 |
|------|------|------|
| `/api/admin/login` | POST | 登錄 |
| `/api/admin/upload` | POST | 圖片上傳到 Supabase Storage |
| `/api/admin/characters` | GET/POST | 角色（含 type 篩選） |
| `/api/admin/haojie/[id]` | GET/PUT/DELETE | 豪傑 |
| `/api/admin/buildings/[id]` | GET/PUT/DELETE | 建築 |
| `/api/admin/items/[id]` | GET/PUT/DELETE | 道具 |
| `/api/admin/fix-character-types` | POST | 批量修復豪傑 characterType |
| `/api/admin/site-config` | GET/PUT | 鍵值對，upsert by key |

### 公開 Wiki API
| 路徑 | 說明 |
|------|------|
| `/api/wiki/banner-articles` | 首頁輪播文章（從 SiteConfig 讀取順序） |
| `/api/wiki/articles` | 文章列表（featured/limit/category 參數） |
| `/api/wiki/buildings` | 建築列表（isPublished 過濾） |
| `/api/wiki/items` | 道具列表（category/slug 參數） |
| `/api/wiki/items/categories` | 道具分類列表 |
| `/api/wiki/items/filter-options` | 道具篩選選項 |
| `/api/wiki/characters/heroes` | 英雄列表 |
| `/api/wiki/site-config` | 網站配置公開字段 |
| `/api/wiki/like` · `/api/wiki/view` | POST，點贊/瀏覽計數 |

---

## 七、共用組件說明

| 組件 | 路徑 | 說明 |
|------|------|------|
| `ImageUploadInput` | `src/components/` | 圖片上傳+預覽+拖拽調位，支持 `compact` 模式（圖標用） |
| `BuildingPreviewModal` | `src/components/` | 建築後台預覽 Modal，傳入 form state 實時渲染 |
| `ItemPreviewModal` | `src/components/` | 道具後台預覽 Modal，同上 |
| `TroopPreviewModal` | `src/components/` | 兵種後台預覽 Modal，支持多行天賦（JSON/舊HTML 均可） |
| `EquipmentPreviewModal` | `src/components/` | 裝備後台預覽 Modal，按 equipType 條件渲染 |
| `RichTextEditor` | `src/components/` | TipTap 富文本，支持圖片嵌入 |
| `MarkdownRenderer` | `src/components/` | Wiki 前台富文本渲染 |
| `LikeButton` | `src/components/` | 點贊按鈕，傳 `entityType` + `entityId` |
| `WikiHeader/Footer` | `src/components/` | 公開 Wiki 頭尾 |

---

## 八、部署

```bash
npm run dev               # 本地開發 localhost:3000
npm run pages:build       # Cloudflare Pages 構建
git push origin main      # 推送後 Cloudflare 自動部署
```

**若報 safe.directory 錯誤：**
```bash
git config --global --add safe.directory 'C:/Users/danqing/Desktop/vibe coding/攻略站_Claude Code'
```

**環境變量（Cloudflare Pages 需配置）：**
```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET / ADMIN_USERNAME / ADMIN_PASSWORD
```

---

## 九、待辦事項

### 前台 Wiki（高優先級）
- [ ] 英雄 Wiki 列表頁 `/wiki/characters/heroes`
- [ ] 豪傑 Wiki 列表頁 `/wiki/characters/haojie`
- [ ] 豪傑 Wiki 詳情頁 `/wiki/characters/haojie/[slug]`
- [ ] 公開豪傑 API `/api/wiki/haojie`

### 圖鑑完善（中優先級）
- [x] 裝備圖鑑（含武器/戰徽/首領/英雄四子類型，equipType 區分）✅ 完整
- [x] 兵種圖鑑後台編輯頁 ✅
- [x] 兵種圖鑑 Wiki 前台主列表 ✅（雙層篩選，單頁架構）
- [ ] 兵種圖鑑 Wiki 詳情頁完整化（`/wiki/troops/[catSlug]/[troopSlug]`）
- [ ] 後續對接豪傑 `haojieEquip.weapon/.warbadge` 引用裝備記錄
- [ ] 各圖鑑跳轉 `href="#"` 補充真實路由

### 新增圖鑑 — 標準開發流程
1. Supabase SQL Editor 建表 + 加字段
2. 同步 `prisma/schema.prisma`
3. 後台 API `route.ts`（GET/POST/PUT/DELETE）
4. 後台列表頁（三Tab：列表/分類/篩選）
5. 後台新增頁 + 編輯頁（sticky 側邊欄 + 分區 + 預覽 Modal）
6. Wiki 分類總覽頁 → 分類列表頁 → 詳情頁
7. Wiki API（公開，isPublished 過濾）
