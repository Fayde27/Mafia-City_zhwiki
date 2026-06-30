-- 活動一覽模塊建表（在 Supabase SQL Editor 執行）
-- EventCategory：活動分類
CREATE TABLE IF NOT EXISTS "EventCategory" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "icon"        TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event：活動主表
CREATE TABLE IF NOT EXISTS "Event" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "slug"          TEXT NOT NULL UNIQUE,
  "summary"       TEXT,
  "icon"          TEXT,
  "iconPosition"  TEXT DEFAULT '50% 50%',
  "image"         TEXT,
  "imagePosition" TEXT DEFAULT '50% 50%',
  "condition"     TEXT,
  "gameplay"      TEXT,
  "rewards"       TEXT,
  "relatedArticleIds" TEXT,
  "likes"         INTEGER NOT NULL DEFAULT 0,
  "categoryId"    TEXT NOT NULL REFERENCES "EventCategory"("id"),
  "sortOrder"     INTEGER NOT NULL DEFAULT 0,
  "isFeatured"    BOOLEAN NOT NULL DEFAULT false,
  "isPublished"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Event_categoryId_idx" ON "Event"("categoryId");
