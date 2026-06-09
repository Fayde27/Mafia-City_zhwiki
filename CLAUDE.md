# CLAUDE.md

## 項目概覽

黑道風雲 / Mafia City 攻略站。Next.js + Prisma（本地 SQLite）+ Supabase（生產 PostgreSQL）+ Cloudflare Pages + Tailwind。

兩個受眾共用一個 Next.js app：
- `/admin/*` — 後台 CMS（JWT cookie 鑒權）
- `/wiki/*` — 公開 Wiki 前台

---

## 硬性約束

- **所有 route 文件頂部必須加** `export const runtime = 'edge'`（Cloudflare Pages 要求）
- **API 用 `supabaseAdmin`**（`@/lib/supabase`），不在 runtime 用 Prisma；Prisma schema 僅作本地遷移參考
- **圖片上傳前必須去除中文和特殊字符**（否則 Supabase Storage 報 Invalid key）
- **Supabase 加新欄位**：需在 Supabase SQL Editor 手動執行 `ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "col" TYPE;`，同步更新 `prisma/schema.prisma`

---

## 代碼慣例

**Admin 表單常用 class（直接複用）：**
```ts
const cardCls  = 'bg-wiki-gray-light border border-wiki-border rounded-lg p-6'
const inputCls = 'w-full bg-wiki-gray border-2 border-wiki-border px-4 py-3 text-wiki-text focus:border-wiki-accent focus:outline-none'
const labelCls = 'block text-wiki-text text-sm font-bold uppercase tracking-wider mb-2'
```

**多對多關聯更新**：採「刪舊插新」策略（先 DELETE WHERE，再 INSERT），不用 upsert。

**JSON 欄位**：DB 存字串，寫入用 `JSON.stringify()`，讀取用 `JSON.parse()`（加 try/catch fallback）。

**大型編輯頁佈局**：左側 Sticky 導航 + 右側分區表單，scroll-spy 高亮當前 section（`offsetTop <= scrollY + 120`）。英雄圖鑑編輯頁是標準範本。

---

## 內容模塊結構

每個模塊的通用形狀：`XxxCategory` + `Xxx` 主表 + `XxxFilterOption`。API 路由對應 `/api/admin/xxx` 和 `/api/wiki/xxx`。

### 角色圖鑑（英雄 + 豪杰共用 `Character` 表）

`Character` 表以 `characterType` 欄位區分：
- `characterType = 'hero'` → 英雄圖鑑，由 `/api/admin/characters` 管理
- `characterType = 'haojie'` → 豪杰圖鑑，由 `/api/admin/haojie` 管理

**後台統一入口**：`/admin/characters`（三 Tab：全部 / 英雄 / 豪杰），編輯按鈕根據 `characterType` 智能路由：
- 英雄 → `/admin/characters/edit/[id]`
- 豪杰 → `/admin/characters/haojie/edit/[id]`

**英雄圖鑑**（`characterType = 'hero'`）：
- 8 張關聯表：皮膚、羁绊、陣容成員、血盟成員、裝備、攻略
- 4 軸雷達圖：攻擊 / 防衛 / 魅帥 / 速度
- 編輯頁：`src/app/admin/characters/edit/[id]/page.tsx`（是所有大型編輯頁的標準範本）

**豪杰圖鑑**（`characterType = 'haojie'`）：
- 無複雜關聯表，所有內容存主表 JSON 欄位
- 5 軸雷達圖：力量 / 技術 / 體魄 / 防護 / 速度（存於 `attributes` JSON）
- 裝備：武器 + 戰徽各一件，存於 `haojieEquip` JSON（`{weapon, warbadge}`）；後續武器/戰徽圖鑑上線後改為 ID 引用
- 覺醒狀態：`awakenHero` Boolean 欄位
- 編輯頁：`src/app/admin/characters/haojie/edit/[id]/page.tsx`
- 7 個內容區塊：基本信息 / 圖片上傳 / 豪杰屬性 / 豪杰技能 / 裝備推薦 / 配隊推薦 / 黑道傳聞

**`Character` 表關鍵欄位（豪杰相關）：**
```
characterType  TEXT DEFAULT 'hero'
awakenHero     BOOLEAN DEFAULT false
haojieEquip    TEXT  (JSON: {weapon, warbadge})
attributes     TEXT  (JSON: 英雄用4軸, 豪杰用5軸)
```

---

## 常用命令

```bash
npm run dev               # 本地開發
npx prisma migrate dev    # 本地 DB 遷移
git push origin main      # 推送（SSH 已配置）
# 若報 safe.directory 錯誤：
git config --global --add safe.directory 'C:/Users/danqing/Desktop/vibe coding/攻略站_Claude Code'
```

---

## 待辦

- 英雄 Wiki 列表頁 `/wiki/characters/heroes`
- 豪杰 Wiki 列表頁 `/wiki/characters/haojie`
- 豪杰 Wiki 詳情頁 + 對應 `/api/wiki/haojie` 路由
- 武器圖鑑（後續對接豪杰裝備 `weapon` 欄位）
- 戰徽圖鑑（後續對接豪杰裝備 `warbadge` 欄位）
- 各圖鑑跳轉 `href="#"` 預留位後續補充
