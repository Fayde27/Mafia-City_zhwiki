# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint
npm run seed         # Seed SQLite dev DB: npx tsx --env-file=.env prisma/seed.ts
npm run pages:build  # Build for Cloudflare Pages
npm run preview      # Preview Cloudflare build locally
```

Prisma operations:
```bash
npx prisma migrate dev    # Apply schema changes to dev DB
npx prisma studio         # Open DB GUI
```

## Architecture

**Game wiki platform** (黑道風雲 / Mafia City) with two audiences sharing one Next.js app:
- `/admin/*` — password-protected CMS for managing all content
- `/wiki/*` — public-facing wiki, guides, and game data
- `/api/admin/*` — protected REST endpoints
- `/api/wiki/*` — public REST endpoints

**Routing model**: Subdomain-based separation via env vars (`ADMIN_DOMAIN=admin`, `PLAYER_DOMAIN=wiki`). Middleware at `src/middleware.ts` guards all `/admin` routes with JWT cookie (`admin-token`), redirecting unauthenticated requests to `/admin/login`.

**Data layer**: Prisma ORM with SQLite locally, Supabase (PostgreSQL) in production. All API routes use `supabaseAdmin` from `@/lib/supabase` directly — NOT Prisma at runtime. Prisma schema is used only for local dev migration reference.

**Auth**: PBKDF2 password hashing (100k iterations) + 7-day JWT tokens. See `src/lib/auth.ts`.

**Editor**: TipTap v3 rich text editor (`src/components/RichTextEditor.tsx`) used in all admin content forms. Articles display via `src/components/MarkdownRenderer.tsx`.

**Deployment**: Cloudflare Pages via `@cloudflare/next-on-pages`. All route files MUST have `export const runtime = 'edge'` at the top. Image optimization is disabled in `next.config.mjs`. Uploaded images live in Supabase Storage bucket (`public/assets/uploads`). Filenames are sanitized (Chinese & special chars stripped) before upload.

**Styling**: Tailwind with a custom `wiki-*` color palette (米白色 light theme, gold accent `wiki-accent`) and custom fonts (`heading`: Impact/Arial Black, `body`: Arial/Helvetica) defined in `tailwind.config.js`.

**Path alias**: `@/*` maps to `src/*`.

---

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — SQLite path (`file:./dev.db`) for local, Supabase connection string for prod
- `JWT_SECRET` — signs admin session tokens
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — initial admin credentials (used by seed)
- `ADMIN_DOMAIN` / `PLAYER_DOMAIN` — subdomain routing
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase (prod)

---

## Content Modules（已完成）

每個模塊的結構相同：`XxxCategory` 分類表 + `Xxx` 主表 + `XxxFilterOption` 篩選選項表。

| 模塊 | 後台列表 | 後台編輯 | Wiki 詳情頁 |
|------|---------|---------|------------|
| 攻略文章 | `/admin/articles` | `/admin/articles/edit/[id]` | `/wiki/article/[slug]` |
| 公告 | `/admin/announcements` | `/admin/announcements/edit/[id]` | `/wiki/announcements/[id]` |
| **英雄圖鑑** | `/admin/characters` | `/admin/characters/edit/[id]` | `/wiki/characters/heroes/[slug]` |
| 建築圖鑑 | `/admin/buildings` | `/admin/buildings/edit/[id]` | `/wiki/buildings/[slug]/[buildingSlug]` |
| 裝備圖鑑 | `/admin/equipment` | `/admin/equipment/edit/[id]` | `/wiki/equipment/[slug]/[equipmentSlug]` |
| 道具圖鑑 | `/admin/items` | `/admin/items/edit/[id]` | `/wiki/items/[slug]/[itemSlug]` |
| 兵種圖鑑 | `/admin/troops` | `/admin/troops/edit/[id]` | `/wiki/troops/[slug]/[troopSlug]` |

---

## 英雄圖鑑系統（重點說明）

### DB 結構

```
Character                          主表（slug 唯一）
├── CharacterSkin[]                皮膚（Cascade Delete）
├── CharacterSkinBond[]            皮膚羁绊（Cascade Delete）
├── CharacterTeamComp[]            陣容搭配（Cascade Delete）
│   └── CharacterTeamCompMember[]   成員（memberId → Character.id，無 Cascade）
├── CharacterBloodBond[]           血盟（Cascade Delete）
│   └── CharacterBloodBondMember[]  成員（memberId → Character.id，無 Cascade）
├── CharacterEquipment[]           推薦裝備 junction（equipmentId，無 Cascade）
└── CharacterArticle[]             關聯攻略 junction（articleId，無 Cascade）
```

### Character 主表欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| `name` | String | 英雄名稱 |
| `slug` | String unique | URL 鍵 |
| `avatar` | String? | 頭像圖片 URL |
| `avatarPosition` | String? | 頭像顯示焦點，如 `"50% 50%"` |
| `banner` | String? | Banner 大圖 URL |
| `bannerPosition` | String? | Banner 焦點 |
| `rarity` | String | `"金"` / `"紫"` / `"藍"` |
| `traits` | String? | JSON Array，如 `'["攻擊型","速度型"]'` |
| `troopType` | String? | 兵種文字 |
| `acquisition` | String? | 獲取方式 |
| `story` | String? | 英雄故事（TipTap HTML） |
| `attributes` | String? | JSON Object（見下方） |
| `skills` | String? | JSON Array（見下方） |
| `categoryId` | String | FK → CharacterCategory |
| `isPublished` | Boolean | 是否發佈 |

### JSON 欄位格式

```jsonc
// attributes（String 欄位，存 JSON）
{
  "attackBase": "80",  "attackMax": "320",
  "defenseBase": "60", "defenseMax": "240",
  "charismaBase": "50","charismaMax": "200",
  "speedBase": "70",   "speedMax": "280"
}

// skills（String 欄位，存 JSON Array）
[{
  "icon": "https://...",
  "type": "帶隊生效",    // 僅 "帶隊生效" 或 "被動生效"
  "name": "技能名稱",
  "effect": "效果描述",
  "multiplier": "5%/10%/15%"
}]

// CharacterSkin.bonuses / CharacterSkinBond.bonuses / CharacterBloodBond.bonuses
[{"label": "攻擊力", "value": "+15%"}]

// CharacterSkinBond.skinIds（以 "skin-{index}" 標記皮膚在列表中的位置）
["skin-0", "skin-2"]
```

### API 路由

| 路由 | 說明 |
|------|------|
| `GET /api/admin/characters` | 分頁列表（支援 category/draft 篩選） |
| `POST /api/admin/characters` | 新建，body 含所有關聯陣列 |
| `GET /api/admin/characters/[id]` | 完整資料，`teamComps[].memberIds[]` 為 ID 陣列 |
| `PUT /api/admin/characters/[id]` | 更新，關聯採「刪舊插新」 |
| `DELETE /api/admin/characters/[id]` | 刪除（Cascade 自動清關聯） |
| `GET /api/wiki/characters/heroes?slug=xxx` | Wiki 端，`members[]` 已 resolve 為物件 |

### 後台編輯頁功能

- 路由：`/admin/characters/edit/[id]`，`id=new` 時為新增模式
- `/admin/characters/new` 自動 redirect 到 `edit/new`
- 左側 Sticky 導航（10 區塊，scroll-spy 自動高亮）
- 右上角「**預覽**」按鈕：開啟右側抽屜 modal，即時渲染當前表單（不需儲存）
- 雷達圖四邊形預覽（上限 100）
- 技能圖標：URL 輸入 + 選擇文件 + 懸停 Ctrl+V 貼圖
- 關聯攻略：支援標題搜尋篩選

### Wiki 詳情頁功能

- Banner 卡（頭像圓形 + 名稱 + 稀有度色彩 + 特性 Tag + 兵種 + 獲取方式）
- 英雄故事 Modal（點按鈕彈出，可點遮罩關閉）
- 左側 Sticky 導航（無內容的 section 自動隱藏）
- 英雄屬性：雷達圖（藍=初始/金=滿級）+ 數值表
- 英雄技能：每技能一卡，類型 Badge 藍/金色區分
- 推薦裝備：圖標格，`href="#"` 預留跳轉
- 陣容搭配：Tab 切換各組，頭像 `href="#"` 預留
- 英雄皮膚：Tab 切換 + 皮膚羁绊緊接其後
- 血盟：成員頭像 + 所需星級 + 加成列表
- 相關攻略：桌面右下角浮動抽屜

---

## 豪杰圖鑑（待做）

豪杰圖鑑（Heroes of Legend）架構與英雄圖鑑相同，差異點待確認後補充。

### 推薦複用策略：共用 `Character` 表，用 `categoryId` 區分

優點：所有關聯表自動複用，英雄和豪杰可互相引用（陣容搭配、血盟跨類型），Admin API 完全複用。

**只需新建：**

1. 在後台 `/admin/character-categories` 新增豪杰分類條目
2. Wiki 詳情頁：`src/app/wiki/characters/heroes-of-legend/[slug]/page.tsx`（copy 英雄頁修改）
3. Wiki API：`src/app/api/wiki/characters/heroes-of-legend/route.ts`（copy heroes route 修改）
4. 若豪杰有獨有欄位：在 `Character` 表加 nullable 欄位，Supabase 執行 `ALTER TABLE` 補列，Prisma schema 同步加欄位

**無需新建：**Admin 編輯頁（現有頁面選豪杰分類即可）、所有關聯表、Admin API

---

## 共用組件

| 組件 | 說明 |
|------|------|
| `ImageUploadInput` | 圖片上傳。必填：`label`, `value`, `onChange`, `onPositionChange`。可選：`position`, `previewHeight`（Tailwind class）, `objectFit`（`cover`/`contain`）。支援 URL 輸入 / 文件上傳 / Ctrl+V 貼圖 / 拖拉調整焦點 |
| `RichTextEditor` | TipTap v3 富文本。Props：`value`, `onChange`, `minHeight` |
| `MarkdownRenderer` | 渲染 TipTap HTML。Props：`content` |
| `ArticleBackground` | 文章頁兩側角色立繪背景，從 SiteConfig 讀取配置（啟用開關、左右圖 URL、透明度/縮放/偏移/翻轉） |
| `LikeButton` | 點讚，每次 +1，300ms cooldown，無取消邏輯 |
| `WikiHeader` / `WikiFooter` | 全局頁眉頁腳 |

---

## Admin 佈局模式

### 帶 Sticky 側欄的大型編輯頁（英雄圖鑑採用，豪杰複用）

```tsx
const cardCls = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'

// 外層結構
<div className="flex gap-6 items-start">
  <aside className="hidden lg:block w-44 flex-shrink-0 sticky top-24">
    {/* 導航按鈕 + 保存按鈕 */}
  </aside>
  <div className="flex-1 space-y-8 min-w-0">
    {/* 各 section 卡片 ref={el => sectionRefs.current['xxx'] = el} */}
  </div>
</div>
```

Scroll-spy：監聽 `window.scroll`，比對各 section `offsetTop <= scrollY + 120`。

---

## API 編寫慣例

- 頂部必須 `export const runtime = 'edge'`
- 使用 `supabaseAdmin` from `@/lib/supabase`（不用 Prisma）
- 關聯嵌套查詢：`.select('*, RelatedTable(*)')`
- 多對多關聯更新：「刪舊插新」策略（先 DELETE WHERE，再 INSERT）
- JSON 欄位：DB 存字串，讀取用 `JSON.parse()`，寫入用 `JSON.stringify()`
- 向 Supabase 新增欄位：`ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "colName" TYPE;`

---

## 待辦事項

- [ ] 英雄列表頁 `/wiki/characters/heroes`
- [ ] 豪杰圖鑑系統
- [ ] 裝備分類「險域」定位確認（部位？還是來源？）
- [ ] 陣容/血盟/裝備/皮膚的 `href` 目標（目前均為 `href="#"` 預留）
- [ ] Supabase 補建 `avatarPosition` 欄位（若尚未執行）：
  `ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "avatarPosition" TEXT;`
