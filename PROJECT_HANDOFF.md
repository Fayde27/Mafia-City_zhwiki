# 黑道風雲 Wiki 攻略站 — 項目交接文檔

> 最後更新：2026-06-10

---

## 目錄

1. [項目概覽](#1-項目概覽)
2. [技術棧](#2-技術棧)
3. [本地開發環境搭建](#3-本地開發環境搭建)
4. [環境變量](#4-環境變量)
5. [項目目錄結構](#5-項目目錄結構)
6. [路由地圖](#6-路由地圖)
7. [API 路由一覽](#7-api-路由一覽)
8. [數據庫模型](#8-數據庫模型)
9. [核心架構說明](#9-核心架構說明)
10. [UI 設計系統](#10-ui-設計系統)
11. [部署流程](#11-部署流程)
12. [硬性約束與注意事項](#12-硬性約束與注意事項)
13. [待辦事項](#13-待辦事項)
14. [常用命令速查](#14-常用命令速查)

---

## 1. 項目概覽

**黑道風雲 / Mafia City** 官方 Wiki 攻略站。

兩個受眾共用同一個 Next.js 應用：

| 模塊 | 路徑 | 說明 |
|------|------|------|
| 後台 CMS | `/admin/*` | JWT cookie 鑒權，編輯所有內容 |
| 公開 Wiki | `/wiki/*` 及 `/` | 玩家瀏覽，無需登錄 |

---

## 2. 技術棧

| 層次 | 技術 | 版本 | 說明 |
|------|------|------|------|
| 框架 | Next.js | ^14.2 | App Router，全站 `runtime = 'edge'` |
| 樣式 | Tailwind CSS | ^3.4 | 自定義 wiki-* 顏色系統 |
| 數據庫（本地） | Prisma + SQLite | — | 僅用於本地 schema 管理與遷移 |
| 數據庫（生產） | Supabase PostgreSQL | — | 通過 `supabaseAdmin` 直接查詢 |
| 文件存儲 | Supabase Storage | — | 圖片上傳，bucket 為 `wiki-images` |
| 認證 | jose（JWT） | ^6.2 | cookie `admin_token`，有效期 7 天 |
| 富文本 | TipTap | ^3.23 | 文章編輯器 |
| 部署 | Cloudflare Pages | — | `npm run pages:build` |

---

## 3. 本地開發環境搭建

```bash
# 1. 克隆倉庫
git clone git@github.com:Fayde27/Mafia-City_zhwiki.git
cd Mafia-City_zhwiki

# 2. 安裝依賴
npm install

# 3. 配置環境變量（複製並填寫真實值）
cp .env.example .env

# 4. 初始化本地數據庫
npx prisma migrate dev

# 5. 填充初始數據（可選）
npm run seed

# 6. 啟動開發服務器
npm run dev
# → http://localhost:3000
```

> **若報 `safe.directory` 錯誤：**
> ```bash
> git config --global --add safe.directory 'C:/Users/danqing/Desktop/vibe coding/攻略站_Claude Code'
> ```

---

## 4. 環境變量

### `.env`（本地開發）

```env
# 本地 SQLite（Prisma 遷移用）
DATABASE_URL="file:./dev.db"

# JWT 鑒權
JWT_SECRET="你的密鑰字符串"

# 後台默認賬號（首次 seed 時使用）
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# 域名區分（開發環境可不填）
ADMIN_DOMAIN="admin"
PLAYER_DOMAIN="wiki"

# Supabase（生產數據庫 + 文件存儲）
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # 僅後端使用，勿暴露給前端
```

### Cloudflare Pages 環境變量

在 Cloudflare Dashboard → Pages → 項目設置 → Environment variables 中配置與上述相同的所有 key（除 `DATABASE_URL`）。

---

## 5. 項目目錄結構

```
src/
├── app/
│   ├── page.tsx                    # 首頁（Wiki 主入口）
│   ├── layout.tsx                  # 根 Layout
│   ├── admin/                      # 後台管理（見路由地圖）
│   ├── wiki/                       # 公開 Wiki（見路由地圖）
│   └── api/
│       ├── admin/                  # 後台 API（需 JWT 驗證）
│       └── wiki/                   # 公開 Wiki API
├── components/
│   ├── WikiHeader.tsx              # 全站頂部導航
│   ├── WikiFooter.tsx              # 全站頁腳
│   ├── RichTextEditor.tsx          # TipTap 富文本編輯器
│   ├── MarkdownRenderer.tsx        # Markdown 渲染
│   ├── ImageUploadInput.tsx        # 圖片上傳輸入框（含位置調整）
│   ├── ImageLightbox.tsx           # 圖片燈箱預覽
│   ├── ImageNode.tsx               # TipTap 圖片節點擴展
│   ├── ArticleActionBar.tsx        # 文章操作欄（點贊/分享）
│   ├── ArticleBackground.tsx       # 文章背景組件
│   └── LikeButton.tsx              # 點贊按鈕
├── hooks/
│   ├── useAdminAuth.ts             # 管理員認證狀態 Hook
│   └── useLocalDraft.ts            # 本地草稿自動保存 Hook
└── lib/
    ├── supabase.ts                 # Supabase 客戶端（supabase + supabaseAdmin）
    └── auth.ts                     # JWT 生成/驗證，密碼哈希

prisma/
├── schema.prisma                   # 數據庫 Schema（本地遷移參考）
└── seed.ts                         # 初始數據填充腳本
```

---

## 6. 路由地圖

### 後台管理 `/admin/*`

| 路徑 | 說明 |
|------|------|
| `/admin/login` | 登錄頁 |
| `/admin/dashboard` | 儀表板 |
| `/admin/characters` | 角色圖鑑統一列表（英雄 + 豪杰 Tab） |
| `/admin/characters/edit/[id]` | 英雄編輯頁（**標準大型編輯頁範本**） |
| `/admin/characters/haojie/edit/[id]` | 豪杰編輯頁 |
| `/admin/buildings`、`/[id]`、`/new` | 建築管理 |
| `/admin/equipment`、`/[id]`、`/new` | 裝備管理 |
| `/admin/items`、`/[id]`、`/new` | 道具管理 |
| `/admin/troops`、`/[id]`、`/new` | 兵種管理 |
| `/admin/articles`、`/new`、`/edit/[id]` | 攻略文章管理 |
| `/admin/announcements`、`/new`、`/edit/[id]` | 公告管理 |
| `/admin/categories` | 文章分類 |
| `/admin/character-categories` | 角色分類 |
| `/admin/building-categories` | 建築分類 |
| `/admin/equipment-categories` | 裝備分類 |
| `/admin/item-categories` | 道具分類 |
| `/admin/troop-categories` | 兵種分類 |
| `/admin/character-filters` | 角色篩選項管理 |
| `/admin/building-filters` | 建築篩選項管理 |
| `/admin/equipment-filters` | 裝備篩選項管理 |
| `/admin/item-filters` | 道具篩選項管理 |
| `/admin/troop-filters` | 兵種篩選項管理 |
| `/admin/site-config` | 網站配置（Banner 圖、熱搜標籤等） |
| `/admin/sidebar-nav`、`/[id]` | 側邊欄導航條目管理 |
| `/admin/sidebar-sections` | 側邊欄分區管理 |
| `/admin/wiki-categories` | Wiki 分類管理 |
| `/admin/submissions` | 用戶投稿管理 |
| `/admin/drafts` | 草稿管理 |

### 公開 Wiki

| 路徑 | 說明 |
|------|------|
| `/` | 首頁（搜索 Banner + 輪播 + 熱門攻略 + 公告） |
| `/wiki` | 圖鑑總覽頁 |
| `/wiki/article/[slug]` | 文章詳情頁 |
| `/wiki/characters` | 角色圖鑑（含英雄/豪杰） |
| `/wiki/characters/[slug]` | 角色分類列表 |
| `/wiki/characters/[slug]/[characterSlug]` | 角色詳情 |
| `/wiki/characters/heroes` | 英雄列表（**待完善**） |
| `/wiki/buildings`、`/[slug]`、`/[slug]/[id]` | 建築圖鑑 |
| `/wiki/equipment`、`/[slug]`、`/[slug]/[id]` | 裝備圖鑑 |
| `/wiki/items`、`/[slug]`、`/[slug]/[id]` | 道具圖鑑 |
| `/wiki/troops`、`/[slug]`、`/[slug]/[id]` | 兵種圖鑑 |
| `/wiki/announcements/[id]` | 公告詳情 |
| `/wiki/rankings` | 排行榜 |
| `/wiki/search` | 搜索結果頁 |
| `/wiki/events` | 活動一覽 |
| `/wiki/submit` | 玩家投稿 |

---

## 7. API 路由一覽

### 後台 API `/api/admin/*`（需 JWT cookie）

| 路徑 | 方法 | 說明 |
|------|------|------|
| `/api/admin/login` | POST | 登錄，返回 JWT cookie |
| `/api/admin/check` | GET | 驗證 token 有效性 |
| `/api/admin/upload` | POST | 圖片上傳到 Supabase Storage |
| `/api/admin/characters` | GET/POST | 角色列表（支持 type/category 篩選）/創建 |
| `/api/admin/characters/[id]` | GET/PUT/DELETE | 英雄詳情/更新/刪除 |
| `/api/admin/haojie` | GET/POST | 豪杰列表/創建 |
| `/api/admin/haojie/[id]` | GET/PUT/DELETE | 豪杰詳情/更新/刪除 |
| `/api/admin/character-categories` | GET/POST | 角色分類 |
| `/api/admin/character-categories/[id]` | GET/PUT/DELETE | — |
| `/api/admin/character-filters` | GET/POST | 角色篩選項 |
| `/api/admin/character-filters/[id]` | GET/PUT/DELETE | — |
| `/api/admin/buildings` | GET/POST | 建築 |
| `/api/admin/buildings/[id]` | GET/PUT/DELETE | — |
| `/api/admin/building-categories` | GET/POST | 建築分類 |
| `/api/admin/building-filters` | GET/POST | 建築篩選項 |
| `/api/admin/equipment` | GET/POST | 裝備 |
| `/api/admin/equipment/[id]` | GET/PUT/DELETE | — |
| `/api/admin/equipment-categories` | GET/POST | 裝備分類 |
| `/api/admin/equipment-filters` | GET/POST | 裝備篩選項 |
| `/api/admin/items` | GET/POST | 道具 |
| `/api/admin/items/[id]` | GET/PUT/DELETE | — |
| `/api/admin/troops` | GET/POST | 兵種 |
| `/api/admin/troops/[id]` | GET/PUT/DELETE | — |
| `/api/admin/articles` | GET/POST | 攻略文章 |
| `/api/admin/articles/[id]` | GET/PUT/DELETE | — |
| `/api/admin/categories` | GET/POST | 文章分類 |
| `/api/admin/announcements` | GET/POST | 公告 |
| `/api/admin/announcements/[id]` | GET/PUT/DELETE | — |
| `/api/admin/site-config` | GET/PUT | 網站全局配置 |
| `/api/admin/sidebar-nav` | GET/POST | 側邊欄導航條目 |
| `/api/admin/sidebar-nav/[id]` | GET/PUT/DELETE | — |
| `/api/admin/sidebar-sections` | GET/POST | 側邊欄分區 |
| `/api/admin/wiki-categories` | GET/POST | Wiki 分類 |
| `/api/admin/submissions` | GET/POST | 用戶投稿 |

### 公開 Wiki API `/api/wiki/*`（無需鑒權）

| 路徑 | 說明 |
|------|------|
| `/api/wiki/articles` | 文章列表（支持 featured/limit/category 參數） |
| `/api/wiki/categories` | 文章分類列表 |
| `/api/wiki/announcements` | 公告列表 |
| `/api/wiki/characters` | 角色列表 |
| `/api/wiki/characters/categories` | 角色分類 |
| `/api/wiki/characters/filter-options` | 角色篩選選項 |
| `/api/wiki/characters/heroes` | 英雄列表 |
| `/api/wiki/buildings` + `/categories` + `/filter-options` | 建築相關 |
| `/api/wiki/equipment` + `/categories` + `/filter-options` | 裝備相關 |
| `/api/wiki/items` + `/categories` + `/filter-options` | 道具相關 |
| `/api/wiki/troops` + `/categories` + `/filter-options` | 兵種相關 |
| `/api/wiki/sidebar-nav` | 側邊欄導航 |
| `/api/wiki/sidebar-sections` | 側邊欄分區 |
| `/api/wiki/site-config` | 網站配置（公開字段） |
| `/api/wiki/like` | POST，文章點贊 |
| `/api/wiki/view` | POST，記錄瀏覽數 |
| `/api/wiki/submissions` | POST，玩家投稿 |

---

## 8. 數據庫模型

> 生產庫：Supabase PostgreSQL。本地開發：SQLite（`prisma/schema.prisma`）。
> 所有 runtime 代碼使用 `supabaseAdmin` 查詢，**不使用 Prisma Client**。

### 核心模型速覽

| 模型 | 關鍵字段 | 說明 |
|------|----------|------|
| `User` | `username`, `password`, `role` | 後台管理員賬號 |
| `Category` | `name`, `slug`, `icon` | 攻略文章分類 |
| `Article` | `title`, `slug`, `coverImage`, `isPinned`, `badges`, `views` | 攻略文章，支持封面圖/角標/置頂 |
| `Announcement` | `title`, `content`, `type`, `isActive` | 全站公告，type: `new/update/important/info` |
| `Character` | `characterType`, `categoryId`, `attributes`, `skills`, `haojieEquip`, `awakenHero` | 英雄+豪杰共用表 |
| `CharacterCategory` | `name`, `slug`, `icon` | 角色分類（如「英雄」「豪杰」） |
| `CharacterSkin` | `name`, `art`, `bonuses` | 角色皮膚 |
| `CharacterTeamComp` | `name`, `memberIds`, `reason` | 陣容搭配（JSON） |
| `CharacterBloodBond` | `memberIds`, `bonuses`, `requiredStars` | 血盟（JSON） |
| `CharacterEquipment` | `characterId`, `equipmentId` | 英雄推薦裝備（多對多） |
| `Equipment` | `name`, `icon`, `categoryId` | 裝備圖鑑 |
| `Building` / `Item` / `Troop` | `name`, `slug`, `icon`, `categoryId` | 其他圖鑑（結構相似） |
| `SidebarNav` | `label`, `href`, `section`, `parentId`, `sortOrder` | 首頁側邊欄導航樹 |
| `SidebarSection` | `name`, `slug`, `icon`, `sortOrder` | 側邊欄分區標題 |

### Character 表關鍵字段詳解

```sql
characterType  TEXT DEFAULT 'hero'      -- 'hero' | 'haojie'
awakenHero     BOOLEAN DEFAULT false    -- 豪杰覺醒狀態
haojieEquip    TEXT                     -- JSON: {weaponId, warbadgeId}（關聯 Equipment.id）
attributes     TEXT                     -- JSON:
                                        --   英雄：{attackBase, attackMax, defenseBase...}（4軸）
                                        --   豪杰：{strengthBase, strengthMax, techBase...}（5軸）
skills         TEXT                     -- JSON: [{icon, type, name, effect, multiplier}, ...]
traits         TEXT                     -- JSON: string[]（豪杰風格 / 英雄特質）
teamComps      TEXT                     -- JSON: [{name, memberIds, reason}, ...]
```

### 加新字段流程（重要）

1. 在 Supabase SQL Editor 執行：
   ```sql
   ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "colName" TEXT;
   ```
2. 同步更新 `prisma/schema.prisma`
3. 本地執行 `npx prisma db pull` 或手動更新

---

## 9. 核心架構說明

### 認證流程

```
用戶輸入賬號密碼
    → POST /api/admin/login
    → 驗證 username + bcrypt.compare(password)
    → jose 簽名 JWT，種入 HttpOnly cookie `admin_token`（7天）
    → 前端 useAdminAuth Hook 讀取 /api/admin/check 確認登錄狀態
```

所有後台 API 都調用 `src/lib/auth.ts` 的 `verifyToken()` 驗證 cookie。

### 圖片上傳流程

```
前端選擇文件 / 粘貼圖片
    → POST /api/admin/upload（multipart/form-data）
    → 過濾文件名（去除中文和特殊字符）
    → 上傳到 Supabase Storage bucket: wiki-images
    → 返回公開 URL
```

> ⚠️ **文件名必須只含英文、數字、`-`、`_`、`.`**，否則 Supabase 報 `Invalid key`。

### 角色圖鑑架構（英雄 vs 豪杰）

兩種角色類型共用 `Character` 表，通過 `characterType` 字段區分：

| 維度 | 英雄（hero） | 豪杰（haojie） |
|------|-------------|----------------|
| API | `/api/admin/characters` | `/api/admin/haojie` |
| 編輯頁 | `/admin/characters/edit/[id]` | `/admin/characters/haojie/edit/[id]` |
| 關聯表 | 皮膚/羁绊/陣容/血盟/裝備（多對多） | 全部 JSON 字段存儲 |
| 雷達圖軸 | 攻擊/防衛/魅帥/速度（4軸） | 力量/技術/體魄/防護/速度（5軸） |
| 裝備 | `CharacterEquipment` 關聯表 | `haojieEquip` JSON（存 Equipment ID） |

### 大型編輯頁佈局規範

英雄編輯頁（`/admin/characters/edit/[id]/page.tsx`）是**所有大型編輯頁的標準範本**，包含：
- 左側 Sticky 導航欄 + 保存按鈕
- 右側分區表單（`sectionRefs` + `scrollTo`）
- Scroll-spy 高亮（`offsetTop <= scrollY + 120`）
- 右上角「預覽」按鈕 → 預覽 Modal

### 多對多關聯更新策略

不用 `upsert`，採「**刪舊插新**」：

```typescript
// 先刪除所有舊關聯
await supabaseAdmin.from('CharacterEquipment').delete().eq('characterId', id)
// 再批量插入新關聯
await supabaseAdmin.from('CharacterEquipment').insert(newItems)
```

---

## 10. UI 設計系統

### 顏色系統（Tailwind 自定義）

| Token | 顏色 | 用途 |
|-------|------|------|
| `wiki-accent` | `#c4a35a` | 金色主色調，標題/按鈕/高亮 |
| `wiki-accent-light` | `#d4b86a` | 金色淺色 |
| `wiki-accent-dark` | `#a8894a` | 金色深色 |
| `wiki-bg` | `#f5f5f0` | 頁面背景 |
| `wiki-card` | `#ffffff` | 卡片背景 |
| `wiki-gray` | `#e8e8e8` | 表單輸入背景 |
| `wiki-gray-light` | `#f0f0eb` | 卡片淺背景 |
| `wiki-text` | `#1a1a1a` | 正文 |
| `wiki-text-muted` | `#999999` | 次要文字 |
| `wiki-border` | `#e0e0e0` | 邊框 |
| `wiki-danger` | `#dc2626` | 危險/刪除 |

### 後台表單常用 class（直接複用）

```typescript
const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'
```

### 字體

```javascript
fontFamily: {
  heading: ['Impact', 'Arial Black', 'sans-serif'],  // 大標題
  body:    ['Arial', 'Helvetica', 'sans-serif'],      // 正文
}
```

---

## 11. 部署流程

### 生產環境：Cloudflare Pages

```bash
# 構建
npm run pages:build    # 等同於 npx @cloudflare/next-on-pages

# 本地預覽 Cloudflare 環境
npm run preview
```

Cloudflare Pages 自動監聽 `main` 分支，push 後自動觸發構建。

### 手動推送

```bash
git add .
git commit -m "feat/fix/chore: 描述"
git push origin main
```

### ⚠️ Cloudflare Edge Runtime 要求

**所有** route 文件（`page.tsx`、`route.ts`、`layout.tsx`）頂部必須加：
```typescript
export const runtime = 'edge'
```
否則構建失敗。

---

## 12. 硬性約束與注意事項

### 必須遵守

1. **`export const runtime = 'edge'`** — 所有 route 文件頂部必加，Cloudflare Pages 要求。

2. **API 只用 `supabaseAdmin`** — 不在 runtime 使用 Prisma Client（Edge 環境不支持）。  
   ```typescript
   import { supabaseAdmin } from '@/lib/supabase'
   ```

3. **圖片文件名** — 上傳前必須去除中文和特殊字符（只留英文、數字、`-`、`_`、`.`）。

4. **JSON 字段讀寫** — DB 存字串，必須：
   ```typescript
   // 寫入
   JSON.stringify(value)
   // 讀取（加 fallback）
   try { JSON.parse(str) } catch { return fallback }
   ```

5. **Supabase 加新字段** — 必須手動在 Supabase SQL Editor 執行 `ALTER TABLE`，再同步 `schema.prisma`，Prisma 遷移**不會**自動同步到生產庫。

### 常見坑

- `useAdminAuth` 返回 `isLoaded: false` 時頁面不應渲染（會閃跳到登錄頁）
- 豪杰的 `editLink` 判斷：同時檢查 `characterType === 'haojie'` 和分類名包含「豪」（DB 舊數據 `characterType` 可能錯誤）
- 多對多更新一定要用「刪舊插新」，不要用 upsert
- Cloudflare Pages 不支持 Node.js API（`fs`、`path` 等），Edge Runtime 只支持 Web API

---

## 13. 待辦事項

### 前台 Wiki（高優先級）

| 項目 | 路徑 | 說明 |
|------|------|------|
| 英雄 Wiki 列表頁 | `/wiki/characters/heroes` | 需展示篩選、搜索、稀有度標籤 |
| 豪杰 Wiki 列表頁 | `/wiki/characters/haojie` | 同上，5 軸屬性展示 |
| 豪杰 Wiki 詳情頁 | `/wiki/characters/haojie/[slug]` | 對應 `/api/wiki/haojie` 路由 |
| `/api/wiki/haojie` 路由 | — | 公開豪杰列表/詳情 API |

### 圖鑑擴展（中優先級）

| 項目 | 說明 |
|------|------|
| 武器圖鑑 | 上線後將豪杰 `haojieEquip.weaponId` 由文字改為 ID 引用（已預留） |
| 戰徽圖鑑 | 同上 `haojieEquip.warbadgeId` |

### 工程優化（低優先級）

| 項目 | 說明 |
|------|------|
| 各圖鑑跳轉 `href="#"` 補充 | 待對應詳情頁上線後補充真實路由 |
| 首頁輪播 Banner 專用標記 | 目前從 featured 文章篩選，可加 `isBanner` 字段精確控制 |
| DB 數據修復 | 部分舊角色 `characterType` 未正確設置，需執行修復 SQL（見下） |

### 數據修復 SQL

```sql
-- 修復 characterType 未正確設置的豪杰角色
UPDATE "Character"
SET "characterType" = 'haojie'
WHERE "categoryId" IN (
  SELECT id FROM "CharacterCategory" WHERE name LIKE '%豪%'
)
AND "characterType" != 'haojie';
```

---

## 14. 常用命令速查

```bash
# 開發
npm run dev                        # 本地開發服務器（localhost:3000）
npm run build                      # 生產構建（Next.js 標準）
npm run pages:build                # Cloudflare Pages 構建

# 數據庫
npx prisma migrate dev             # 本地 SQLite 遷移（加新字段後執行）
npx prisma studio                  # 可視化查看本地 DB
npx prisma db pull                 # 從遠程 DB 拉取 schema（謹慎使用）
npm run seed                       # 填充初始數據

# Git
git push origin main               # 推送到生產

# 常見問題
git config --global --add safe.directory 'C:/Users/danqing/Desktop/vibe coding/攻略站_Claude Code'
```

---

## 附錄：最近提交記錄

| commit | 說明 |
|--------|------|
| `adbe044` | feat(home): 首頁新增滾動輪播 Banner |
| `1e992c1` | refactor(admin/haojie): 裝備推薦改為從圖鑑庫單選 |
| `75a3250` | feat(admin/haojie): 新增預覽功能及增強裝備推薦編輯 |
| `51a250d` | fix(admin): 修正新增按鈕與編輯路由的繁簡字判斷 |
| `9165674` | fix(admin): 修正角色列表重複篩選行與類型顯示問題 |
| `64c1d38` | docs: 更新 CLAUDE.md，補充豪杰圖鑑架構 |
| `f06295a` | refactor: 統一英雄豪杰至角色圖鑑同一列表頁 |
| `982ffae` | feat: 新增豪杰圖鑑後台管理模塊 |
