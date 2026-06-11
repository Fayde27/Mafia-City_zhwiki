# 黑道風雲 Wiki 攻略站 — 項目參考文檔

> 最後更新：2026-06-11

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
左側 Sticky 導航 + 右側分區表單 + scroll-spy 高亮（`offsetTop <= scrollY + 120`）。  
→ 參考：`src/app/admin/characters/edit/[id]/page.tsx`（英雄編輯頁，所有大型編輯頁的標準範本）

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
| 豪杰 | `haojie` | `/api/admin/haojie` | `/admin/characters/haojie/edit/[id]` |

後台統一入口：`/admin/characters`（三 Tab：全部 / 英雄 / 豪杰），編輯按鈕智能路由。

**英雄**：8 張關聯表（皮膚/羁绊/陣容/血盟/裝備/攻略）· 4 軸雷達圖（攻擊/防衛/魅帥/速度）  
**豪杰**：全 JSON 字段 · 5 軸雷達圖（力量/技術/體魄/防護/速度，存 `attributes`）· 裝備存 `haojieEquip JSON({weapon,warbadge})` · `awakenHero` 布爾字段

**常見坑：** 豪杰 `editLink` 判斷需同時檢查 `characterType==='haojie'` 和分類名含「豪」（舊數據 `characterType` 可能未正確設置）

### 4-2 建築圖鑑（`Building` 表）

**已實現字段：**
```
name / slug / categoryId / icon / iconPosition
image（Banner圖）/ imagePosition
type / function / unlockCondition / summary
description（富文本）/ upgradeLevels（JSON升級表格）
rarity / level / maxLevel / cost / production
sortOrder / isFeatured / isPublished / publishedAt
```

**升級表格 JSON 格式：**
```json
{ "columns": ["等級","升級條件","建造時間","效果加成"], "rows": [["1","總部Lv1","立即","容量500"]] }
```

**後台編輯頁** `/admin/buildings/edit/[id]`：6 分區（基本信息/圖片/建築屬性/詳細信息/升級表格/發佈設置）  
**Wiki 詳情頁** 渲染升級表格為斑馬紋 HTML table，向後兼容舊 `upgradeInfo` 富文本

### 4-3 其他圖鑑（裝備 / 道具 / 兵種）

結構與建築類似，各有 Category + FilterOption，API 在 `/api/admin/xxx` 和 `/api/wiki/xxx`

### 4-4 攻略文章（`Article` 表）

`isFeatured` · `isPinned` · `badges`（HOT/NEW 等逗號分隔）· `isPublished` · `sortOrder`  
富文本用 TipTap，支持圖片嵌入

### 4-5 首頁輪播 Banner

數據流：後台 `/admin/banner-articles` → 保存到 `SiteConfig.bannerArticleIds`（JSON ID 數組）  
→ `/api/wiki/banner-articles` 按序返回文章 → 首頁 `HomeBannerCarousel` 消費  
fallback：未配置時取 `isFeatured=true` 的文章

---

## 五、路由地圖（摘要）

### 後台 `/admin/*`
```
/admin/login · /admin/dashboard
/admin/characters          ← 英雄+豪杰統一列表（三Tab）
/admin/characters/edit/[id]
/admin/characters/haojie/edit/[id]
/admin/buildings · /admin/buildings/new · /admin/buildings/edit/[id]
/admin/equipment · /admin/items · /admin/troops · /admin/articles
/admin/announcements · /admin/categories · /admin/site-config
/admin/banner-articles     ← 首頁輪播文章管理
/admin/sidebar-nav · /admin/sidebar-sections · /admin/wiki-categories
/admin/character-filters · /admin/building-filters · /admin/equipment-filters
```

### 公開 Wiki `/wiki/*`
```
/                          ← 首頁（搜索Banner + 輪播 + 熱門攻略 + 公告）
/wiki                      ← 圖鑑總覽
/wiki/article/[slug]       ← 文章詳情
/wiki/characters/[slug]/[characterSlug]  ← 角色詳情
/wiki/buildings/[slug]/[buildingSlug]    ← 建築詳情
/wiki/equipment · /wiki/items · /wiki/troops  ← 其他圖鑑
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
| `/api/admin/haojie/[id]` | GET/PUT/DELETE | 豪杰 |
| `/api/admin/buildings/[id]` | GET/PUT/DELETE | 建築（含新字段） |
| `/api/admin/site-config` | GET/PUT | 鍵值對，upsert by key |

### 公開 Wiki API
| 路徑 | 說明 |
|------|------|
| `/api/wiki/banner-articles` | 首頁輪播文章（從 SiteConfig 讀取順序） |
| `/api/wiki/articles` | 文章列表（featured/limit/category 參數） |
| `/api/wiki/buildings` | 建築列表（isPublished 過濾） |
| `/api/wiki/characters/heroes` | 英雄列表 |
| `/api/wiki/site-config` | 網站配置公開字段 |
| `/api/wiki/like` · `/api/wiki/view` | POST，點贊/瀏覽計數 |

---

## 七、部署

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

## 八、待辦事項

### 前台 Wiki（高優先級）
- [ ] 英雄 Wiki 列表頁 `/wiki/characters/heroes`
- [ ] 豪杰 Wiki 列表頁 `/wiki/characters/haojie`
- [ ] 豪杰 Wiki 詳情頁 `/wiki/characters/haojie/[slug]`
- [ ] 公開豪杰 API `/api/wiki/haojie`

### 圖鑑擴展（中優先級）
- [ ] 武器圖鑑（後續對接豪杰 `haojieEquip.weapon`）
- [ ] 戰徽圖鑑（後續對接豪杰 `haojieEquip.warbadge`）
- [ ] 各圖鑑跳轉 `href="#"` 補充真實路由

### 數據修復 SQL（可選）
```sql
-- 修復 characterType 未正確設置的豪杰角色
UPDATE "Character"
SET "characterType" = 'haojie'
WHERE "categoryId" IN (SELECT id FROM "CharacterCategory" WHERE name LIKE '%豪%')
AND "characterType" != 'haojie';
```
