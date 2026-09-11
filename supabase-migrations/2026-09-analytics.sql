-- ============================================================
-- 數據看板地基（2026-09）
-- 目的：一張按天聚合表覆蓋全部統計維度，支援日 / 週 / 月切換。
--   舊做法「在各表加計數列」只存一個數字、沒有時間資訊，做不到時間維度。
--
-- ⚠️ 口徑鐵律：看板只認真實值。
--   Article.views 是注水數（每次隨機 +1~5），只給前台展示，
--   看板一律不得取用；看板數據源只有本檔的兩張表 + Article.realViews。
--
-- 在 Supabase SQL Editor 執行（純新增，無破壞性操作）
-- ============================================================

-- ------------------------------------------------------------
-- 一、按天聚合表
--   metric = page   → 模塊 PV，key 為路徑前綴，如 /wiki/items
--   metric = article/item/event/lineup → 單篇內容點擊，key 為該筆 id
--   metric = search → key 固定 '__total__'，記搜索總次數
--   (date, metric, key) 唯一，同一天同一對象只有一行、靠 count 累加
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "DailyStat" (
  "id"     BIGSERIAL PRIMARY KEY,
  "date"   DATE    NOT NULL,
  "metric" TEXT    NOT NULL,
  "key"    TEXT    NOT NULL,
  "count"  INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyStat_date_metric_key_idx"
  ON "DailyStat" ("date", "metric", "key");

-- 看板按「區間 + 維度」取數，這個索引覆蓋主要查詢
CREATE INDEX IF NOT EXISTS "DailyStat_metric_date_idx"
  ON "DailyStat" ("metric", "date");

-- ------------------------------------------------------------
-- 二、搜索詞表
--   hasResult = false 的詞就是「搜了但沒結果」清單，等於選題表
--   同一天同一個詞只有一行；只要當天有任何一次搜出結果就算 true
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SearchLog" (
  "id"        BIGSERIAL PRIMARY KEY,
  "date"      DATE    NOT NULL,
  "keyword"   TEXT    NOT NULL,
  "count"     INTEGER NOT NULL DEFAULT 0,
  "hasResult" BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS "SearchLog_date_keyword_idx"
  ON "SearchLog" ("date", "keyword");

CREATE INDEX IF NOT EXISTS "SearchLog_hasResult_date_idx"
  ON "SearchLog" ("hasResult", "date");

-- ------------------------------------------------------------
-- 三、原子遞增函數
--   避免「先 select 再 update」在併發下丟計數（與既有
--   increment_article_views 同一套寫法）
-- ------------------------------------------------------------

-- 3-1 通用計數遞增
CREATE OR REPLACE FUNCTION increment_daily_stat(
  p_metric TEXT,
  p_key    TEXT
)
RETURNS VOID
LANGUAGE sql
AS $$
  INSERT INTO "DailyStat" ("date", "metric", "key", "count")
  VALUES (CURRENT_DATE, p_metric, p_key, 1)
  ON CONFLICT ("date", "metric", "key")
  DO UPDATE SET "count" = "DailyStat"."count" + 1;
$$;

-- 3-2 搜索詞遞增
--   hasResult 用 OR：當天只要有一次搜出結果，就不再算「無結果」，
--   避免同一個詞因為某次拼錯而被誤列進補內容清單
CREATE OR REPLACE FUNCTION increment_search_log(
  p_keyword    TEXT,
  p_has_result BOOLEAN
)
RETURNS VOID
LANGUAGE sql
AS $$
  INSERT INTO "SearchLog" ("date", "keyword", "count", "hasResult")
  VALUES (CURRENT_DATE, p_keyword, 1, p_has_result)
  ON CONFLICT ("date", "keyword")
  DO UPDATE SET "count"     = "SearchLog"."count" + 1,
                "hasResult" = "SearchLog"."hasResult" OR p_has_result;
$$;

-- ------------------------------------------------------------
-- 四、資料保留 1 年
--   Cloudflare Pages 沒有 cron，由 /api/admin/analytics 被訪問時順手呼叫
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_old_stats()
RETURNS VOID
LANGUAGE sql
AS $$
  DELETE FROM "DailyStat" WHERE "date" < CURRENT_DATE - 365;
  DELETE FROM "SearchLog" WHERE "date" < CURRENT_DATE - 365;
$$;

-- ------------------------------------------------------------
-- 驗證（可選）
-- ------------------------------------------------------------
-- SELECT increment_daily_stat('page', '/wiki/items');
-- SELECT increment_search_log('測試詞', false);
-- SELECT * FROM "DailyStat" ORDER BY "date" DESC, "count" DESC LIMIT 20;
-- SELECT * FROM "SearchLog" WHERE "hasResult" = false ORDER BY "count" DESC LIMIT 20;
