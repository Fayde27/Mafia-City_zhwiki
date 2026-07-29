-- ============================================================
-- 陣容擴充（2026-07 第二階段）
-- 1) 詞條獨立成庫（與武器/戰徽解綁，配隊時單獨選）
-- 2) 英雄配隊：戰寵/異獸 · 英雄裝備(6格) · 套裝(適配流派)
-- 在 Supabase SQL Editor 執行；此檔全部為新增，無破壞性操作
-- ============================================================

-- ------------------------------------------------------------
-- 一、詞條庫（武器詞條 / 戰徽詞條 通用）
--     kind: 'weapon' | 'emblem'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "LineupAttr" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "kind"      TEXT NOT NULL DEFAULT 'weapon',
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 二、戰寵 / 異獸
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "LineupPet" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "kind"      TEXT DEFAULT 'pet',        -- pet(戰寵) | beast(異獸)
  "quality"   TEXT DEFAULT 'gold',
  "imgUrl"    TEXT,
  "attrs"     TEXT DEFAULT '[]',          -- JSON 數組：技能/加成說明
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 三、英雄裝備（6 個部位）
--     slotIndex: 1~6，對應部位；setId 歸屬套裝
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "LineupHeroEquip" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "slotIndex" INTEGER NOT NULL DEFAULT 1,
  "quality"   TEXT DEFAULT 'gold',
  "imgUrl"    TEXT,
  "setId"     TEXT,
  "attrs"     TEXT DEFAULT '[]',
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 四、套裝（額外加成 + 適配流派）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "LineupEquipSet" (
  "id"        TEXT PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "imgUrl"    TEXT,
  "bonus"     TEXT DEFAULT '[]',          -- JSON 數組：套裝加成條目
  "genreIds"  TEXT DEFAULT '[]',          -- JSON 數組：適配流派（LineupGenre.id）
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 說明：Lineup.slots(JSON) 形狀擴充，無需改表
--   豪傑：{ role, heroId, stat, weaponId, weaponAttrIds[], emblemId, emblemAttrIds[] }
--   英雄：{ role, heroId, petIds[], equipIds[](長度6), setId }
--   英雄陣容用 Lineup.characterKind = 'hero' 區分
-- ------------------------------------------------------------
