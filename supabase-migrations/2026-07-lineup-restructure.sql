-- ============================================================
-- 大調整 SQL 遷移（2026-07）
-- 執行順序：先跑「一、新增」，前台驗證 OK 後再跑「四、刪表」
-- 全部在 Supabase SQL Editor 手動執行
-- ============================================================

-- ------------------------------------------------------------
-- 一、新增「陣容搭配」模組表
-- ------------------------------------------------------------

-- 陣容主表
CREATE TABLE IF NOT EXISTS "Lineup" (
  "id"            TEXT PRIMARY KEY,
  "title"         TEXT NOT NULL,
  "slug"          TEXT UNIQUE NOT NULL,
  "characterKind" TEXT NOT NULL DEFAULT 'haojie',   -- haojie | hero（本版只用 haojie）
  "genreId"       TEXT,                              -- 流派（LineupGenre.id）
  "bgUrl"         TEXT,
  "badgeIds"      TEXT DEFAULT '[]',                 -- JSON 數組
  "description"   TEXT,                              -- 富文本解說
  "slots"         TEXT DEFAULT '[]',                 -- JSON：[{role,heroId,stat,weaponId,emblemId} x3]
  "updateText"    TEXT,                              -- 右上角更新日期文字（純展示）
  "isPinned"      BOOLEAN DEFAULT false,
  "isPublished"   BOOLEAN DEFAULT false,
  "sortOrder"     INTEGER DEFAULT 0,
  "createdAt"     TIMESTAMPTZ DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ DEFAULT now()
);

-- 角色池（豪傑/英雄）
CREATE TABLE IF NOT EXISTS "LineupHero" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "style"         TEXT,                              -- 迅捷 | 智謀 | 無畏 | 穩重
  "imgUrl"        TEXT,
  "characterKind" TEXT NOT NULL DEFAULT 'haojie',
  "sortOrder"     INTEGER DEFAULT 0,
  "createdAt"     TIMESTAMPTZ DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ DEFAULT now()
);

-- 武器（含父類/變體）
CREATE TABLE IF NOT EXISTS "LineupWeapon" (
  "id"              TEXT PRIMARY KEY,
  "parentId"        TEXT,                            -- 變體指向父類；父類為 null
  "displayName"     TEXT NOT NULL,
  "variantLabel"    TEXT,
  "quality"         TEXT DEFAULT 'gold',             -- white/green/blue/purple/orange/gold
  "isExclusive"     BOOLEAN DEFAULT false,
  "exclusiveHeroId" TEXT,
  "imgUrl"          TEXT,
  "attrs"           TEXT DEFAULT '[]',               -- JSON 數組（技能/詞條文本）
  "sortOrder"       INTEGER DEFAULT 0,
  "createdAt"       TIMESTAMPTZ DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ DEFAULT now()
);

-- 戰徽（含父類/變體）
CREATE TABLE IF NOT EXISTS "LineupEmblem" (
  "id"           TEXT PRIMARY KEY,
  "parentId"     TEXT,
  "displayName"  TEXT NOT NULL,
  "variantLabel" TEXT,
  "quality"      TEXT DEFAULT 'gold',
  "imgUrl"       TEXT,
  "attrs"        TEXT DEFAULT '[]',                  -- JSON 數組（詞條列表）
  "sortOrder"    INTEGER DEFAULT 0,
  "createdAt"    TIMESTAMPTZ DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ DEFAULT now()
);

-- 流派
CREATE TABLE IF NOT EXISTS "LineupGenre" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "color"     TEXT DEFAULT '#C9A227',
  "imgUrl"    TEXT,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 全域配置（風格圖標/加點圖標/標籤/角色標識/頁面標題等）存 SiteConfig 鍵值，key = 'lineupConfig'
-- 若無 SiteConfig 表則略過（本站已存在）

-- ------------------------------------------------------------
-- 二、活動 ↔ 道具 互鏈字段
-- ------------------------------------------------------------
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "relatedItemIds"  TEXT;  -- JSON 數組：關聯道具 ID
ALTER TABLE "Item"  ADD COLUMN IF NOT EXISTS "relatedEventIds" TEXT;  -- JSON 數組：關聯活動 ID

-- ------------------------------------------------------------
-- 三、獨立工具直傳用的 Storage 桶 + 匿名上傳策略
--     （在 Supabase Dashboard → Storage 先建 public 桶 'tool-uploads'，
--       或用下面 SQL；再套用策略）
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('tool-uploads', 'tool-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 只允許匿名「上傳(insert)」到 tool-uploads，禁止刪除/更新
DROP POLICY IF EXISTS "tool_uploads_anon_insert" ON storage.objects;
CREATE POLICY "tool_uploads_anon_insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'tool-uploads');

-- 允許公開讀取（圖片要能顯示）
DROP POLICY IF EXISTS "tool_uploads_public_read" ON storage.objects;
CREATE POLICY "tool_uploads_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'tool-uploads');

-- ============================================================
-- 四、刪除舊圖鑑表（★ 不可逆 ★ 待前台驗證 OK 後單獨執行）
-- ============================================================
-- DROP TABLE IF EXISTS "CharacterArticle" CASCADE;
-- DROP TABLE IF EXISTS "CharacterEquipment" CASCADE;
-- DROP TABLE IF EXISTS "CharacterBloodBondMember" CASCADE;
-- DROP TABLE IF EXISTS "CharacterBloodBond" CASCADE;
-- DROP TABLE IF EXISTS "CharacterTeamCompMember" CASCADE;
-- DROP TABLE IF EXISTS "CharacterTeamComp" CASCADE;
-- DROP TABLE IF EXISTS "CharacterSkinBond" CASCADE;
-- DROP TABLE IF EXISTS "CharacterSkin" CASCADE;
-- DROP TABLE IF EXISTS "Character" CASCADE;
-- DROP TABLE IF EXISTS "CharacterFilterOption" CASCADE;
-- DROP TABLE IF EXISTS "CharacterCategory" CASCADE;
-- DROP TABLE IF EXISTS "Equipment" CASCADE;
-- DROP TABLE IF EXISTS "EquipmentSet" CASCADE;
-- DROP TABLE IF EXISTS "EquipmentFilterOption" CASCADE;
-- DROP TABLE IF EXISTS "EquipmentCategory" CASCADE;
-- DROP TABLE IF EXISTS "Troop" CASCADE;
-- DROP TABLE IF EXISTS "TroopFilterOption" CASCADE;
-- DROP TABLE IF EXISTS "TroopCategory" CASCADE;
-- DROP TABLE IF EXISTS "Building" CASCADE;
-- DROP TABLE IF EXISTS "BuildingFilterOption" CASCADE;
-- DROP TABLE IF EXISTS "BuildingCategory" CASCADE;
