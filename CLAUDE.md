# 黑道風雲 Wiki 攻略站 — 項目參考文檔

> 最後更新：2026-07-24
>
> ⚠️ 2026-07 大調整：**移除四大圖鑑**（角色/裝備/兵種/建築），站點現只保留三個內容模塊 —— **陣容搭配 · 道具介紹 · 活動介紹**（道具↔活動可互鏈）。詳見第四節。

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
→ 參考：`src/app/admin/events/edit/[id]/page.tsx` 或 `src/app/admin/items/edit/[id]/page.tsx`

**預覽 Modal 規範：**  
接收當前表單 state 實時渲染 Wiki 效果，ESC 關閉。  
→ 現存：`ItemPreviewModal.tsx` · `EventPreviewModal.tsx`（建築/裝備/兵種的預覽 Modal 已隨圖鑑移除）

**陣容搭配後台**（`/admin/lineups`）是**單頁全量編輯**模型（不走上面的 sticky 範本）：一次 GET 載入整個資料集到記憶體，改動後點「保存全部」→ PUT 整組刪舊插新。詳見 4-1。

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

站點現有三個內容模塊：**陣容搭配 · 道具介紹 · 活動介紹**，外加攻略文章與首頁輪播。

### 4-1 陣容搭配（豪傑）✅ — 由線下 HTML 工具並入

一組相關表，展示運營人工配好的「豪傑陣容方案」（不做戰力計算）。**本版只做豪傑**，英雄暫緩（將來用 `characterKind` 區分即可擴展）。

**表結構**（全部手動在 Supabase 建，見 `supabase-migrations/2026-07-lineup-restructure.sql`）：
| 表 | 說明 |
|----|------|
| `Lineup` | 陣容主表：`title/slug/characterKind/genreId/bgUrl/badgeIds(JSON)/description(富文本)/slots(JSON)/updateText/isPinned/isPublished/sortOrder` |
| `LineupHero` | 角色池：`name/style/imgUrl/characterKind` |
| `LineupWeapon` | 武器：`parentId/displayName/variantLabel/quality/isExclusive/exclusiveHeroId/imgUrl/attrs(JSON)`（父類/變體） |
| `LineupEmblem` | 戰徽：`parentId/displayName/variantLabel/quality/imgUrl/attrs(JSON)` |
| `LineupGenre` | 流派：`name/color/imgUrl` |

- `slots` JSON 形狀：`[{role:'main'|'sub1'|'sub2', heroId, stat, weaponId, emblemId} x3]`
- **全域配置**（風格圖標/加點圖標/標籤/角色標識/頁面標題/風格&屬性名稱）存 `SiteConfig` 鍵 `lineupConfig`（一個 JSON）
- 常量與型別集中在 `src/lib/lineup.ts`（品質色 QUALITY_COLOR、風格、加點軸、內建標籤等）

**後台** `/admin/lineups`：**單頁全量編輯**，頂部 6 Tab（陣容/角色池/武器/戰徽/流派/圖標與配置）+「保存全部」。API 只有兩個動作：GET 讀整組、PUT 刪舊插新寫整組（`/api/admin/lineups`）。圖片全走現有 `ImageUploadInput` 快速上傳。  
**Wiki** `/wiki/lineups`：卡片式（3 槽位×立繪+加點+武器+戰徽+富文本解說），流派篩選 + 按角色反查；槽位純展示不可點。公開 API `/api/wiki/lineups?characterKind=&genreId=&heroId=`。

**線下獨立工具**：`桌面\英雄 豪杰搭配工具\豪杰搭配组合工具.html` 可分發、脫機編輯，圖片用 anon 公鑰**直傳** Supabase 桶 `tool-uploads`（匿名 INSERT 策略），數據靠 JSON 存檔導入導出。

### 4-2 道具介紹（`Item` 表，主打稀有道具）✅ — 已層級上調

**字段**：`name/slug/categoryId/summary/icon(+Position)/image(+Position)/source(富文本)/isExchange/exchangeContent(JSON)/relatedEventIds(JSON 互鏈)/sortOrder/isFeatured/isPublished`（另有 rarity/type/quality/... 舊字段保留兼容）

**後台編輯頁** `/admin/items/edit/[id]`：分區含 基本信息/圖片/兌換內容/獲得途徑/**相關活動**/發佈設置。  
**Wiki 列表** `/wiki/items`：**單層**，直接列所有道具，分類變頂部篩選 Tab。  
**Wiki 詳情** `/wiki/items/[slug]`（層級上調，無分類段）：SectionCard 分區 + 底部「相關活動」互鏈卡片。

### 4-3 活動介紹（`Event` 表）✅ — 已層級上調

**字段**：`name/slug/categoryId/summary/icon(+Position)/image(+Position)/condition/gameplay/rewards(均富文本)/relatedArticleIds(JSON)/relatedItemIds(JSON 互鏈)/likes/sortOrder/isFeatured/isPublished`

**後台編輯頁** `/admin/events/edit/[id]`：sticky 分區含 基本/圖片/參與條件/活動玩法/活動獎勵/相關攻略/**相關道具**/發佈；`EventPreviewModal` 預覽。  
**Wiki 列表** `/wiki/events`：**單層**，直接列所有活動，分類變篩選 Tab。  
**Wiki 詳情** `/wiki/events/[slug]`（層級上調）：SectionCard 分區 + 底部「相關道具」互鏈卡片 + 相關攻略 + 點贊。

> **道具 ↔ 活動 互鏈**：`Item.relatedEventIds` 與 `Event.relatedItemIds` 各自獨立維護（在各自編輯頁勾選），兩邊詳情頁互相渲染可點卡片。公開 API 在 `slug` 查詢時解析對方 ID 補出展示欄位。

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
/admin/lineups                        ← 陣容搭配（單頁全量編輯，6 Tab）
/admin/items · /admin/items/new · /admin/items/edit/[id]      ← 道具介紹
/admin/events · /admin/events/new · /admin/events/edit/[id]   ← 活動介紹
/admin/articles · /admin/drafts · /admin/submissions
/admin/announcements · /admin/categories · /admin/site-config
/admin/banner-articles                ← 首頁輪播文章管理
/admin/sidebar · /admin/sidebar-nav · /admin/sidebar-sections · /admin/wiki-categories
/admin/item-categories · /admin/item-filters · /admin/event-categories
```

### 公開 Wiki `/wiki/*`
```
/                                     ← 首頁（搜索Banner + 輪播 + 熱門攻略 + 公告）
/wiki                                 ← 內容總覽（陣容/道具/活動 三卡）
/wiki/lineups                         ← 陣容搭配（流派篩選 + 按角色反查）
/wiki/items                           ← 道具列表（單層，分類篩選）
/wiki/items/[slug]                    ← 道具詳情（含相關活動互鏈）
/wiki/events                          ← 活動列表（單層，分類篩選）
/wiki/events/[slug]                   ← 活動詳情（含相關道具互鏈）
/wiki/article/[slug]                  ← 文章詳情
/wiki/guides · /wiki/tools · /wiki/rankings · /wiki/submit
/wiki/search                          ← 全站搜索（陣容/道具/活動/攻略，模糊匹配）
```

---

## 六、核心 API 一覽

### 後台 API（需 JWT cookie）
| 路徑 | 方法 | 說明 |
|------|------|------|
| `/api/admin/login` | POST | 登錄 |
| `/api/admin/upload` | POST | 圖片上傳到 Supabase Storage（`assets` 桶） |
| `/api/admin/lineups` | GET/PUT | 陣容整組讀取 / 刪舊插新寫入 |
| `/api/admin/items/[id]` | GET/PUT/DELETE | 道具（含 relatedEventIds） |
| `/api/admin/events/[id]` | GET/PUT/DELETE | 活動（含 relatedItemIds） |
| `/api/admin/site-config` | GET/PUT | 鍵值對，upsert by key |

### 公開 Wiki API
| 路徑 | 說明 |
|------|------|
| `/api/wiki/lineups` | 陣容 + 角色/武器/戰徽/流派/配置（characterKind/genreId/heroId 參數） |
| `/api/wiki/items` | 道具列表（無參列全部；slug 查詳情並解析 relatedEvents） |
| `/api/wiki/items/categories` | 道具分類列表 |
| `/api/wiki/events` | 活動列表（無參列全部；slug 查詳情並解析 relatedArticles/relatedItems） |
| `/api/wiki/events/categories` | 活動分類列表 |
| `/api/wiki/search` | 全站搜索（q/type/limit），聚合 陣容/道具/活動/攻略，ilike 模糊 |
| `/api/wiki/articles` | 文章列表（featured/limit/category/search 參數） |
| `/api/wiki/banner-articles` | 首頁輪播文章（從 SiteConfig 讀取順序） |
| `/api/wiki/site-config` | 網站配置公開字段 |
| `/api/wiki/like` · `/api/wiki/view` | POST，點贊/瀏覽計數 |

---

## 七、共用組件說明

| 組件 | 路徑 | 說明 |
|------|------|------|
| `ImageUploadInput` | `src/components/` | 圖片上傳+預覽+拖拽調位，支持 `compact` 模式（圖標用） |
| `ItemPreviewModal` | `src/components/` | 道具後台預覽 Modal，傳入 form state 實時渲染 |
| `EventPreviewModal` | `src/components/` | 活動後台預覽 Modal，同上 |
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

## 九、待辦 / 收尾事項

### 2026-07 大調整收尾
- [ ] **刪舊圖鑑表**（不可逆）：確認新站穩定、舊數據不再需要後，手動執行 `supabase-migrations/2026-07-lineup-restructure.sql` 的「四、DROP TABLE」段（Building/Equipment/Troop/Character 等表；代碼與前台已全部移除）
- [ ] 英雄陣容（本版只做豪傑）：需要時在 `Lineup/LineupHero` 用 `characterKind='hero'` 擴展，前台 `/wiki/lineups` 用篩選區分

### 已完成（2026-07）
- [x] 陣容搭配模組（並入線下工具，豪傑）
- [x] 移除角色/裝備/兵種/建築四大圖鑑
- [x] 活動、道具層級上調為兩層（列表→詳情）
- [x] 道具 ↔ 活動 互鏈
- [x] 全站搜索（陣容/道具/活動/攻略，模糊匹配）
- [x] 線下工具直傳 Supabase（`tool-uploads` 桶）

### 新增內容模塊 — 參考流程
1. Supabase SQL Editor 建表 + 加字段（記得 `runtime='edge'`、只用 `supabaseAdmin`）
2. 同步 `prisma/schema.prisma`
3. 後台 API `route.ts` + 後台編輯頁（sticky 分區 + 預覽 Modal，或單頁全量如陣容）
4. Wiki 列表頁 → 詳情頁（兩層；公開 API 加 `isPublished` 過濾）
5. 導航（WikiHeader / dashboard / `/wiki` 總覽）與搜索 `/api/wiki/search` 掛上新模塊
