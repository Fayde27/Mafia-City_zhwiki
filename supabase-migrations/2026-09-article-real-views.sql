-- ============================================================
-- 文章「真實瀏覽數」（2026-09）
-- 目的：後台要能看到每篇文章的真實瀏覽情況。
--   現況 Article.views 是「注水後的展示數」（每次訪問隨機 +1~5），
--   前台繼續顯示它；這裡另存一個只 +1 的真實計數，僅後台可見。
-- 在 Supabase SQL Editor 執行（純新增欄位，無破壞性操作）
-- ============================================================

ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "realViews" INTEGER DEFAULT 0;

-- 既有資料補 0（DEFAULT 只作用於新列的既有列已填 0，這行是保險）
UPDATE "Article" SET "realViews" = 0 WHERE "realViews" IS NULL;

-- ------------------------------------------------------------
-- 原子遞增函數：避免「先讀再寫」在併發下丟計數
-- 供 /api/wiki/view 以 rpc('increment_article_views') 呼叫
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_article_views(
  p_id TEXT,
  p_display_inc INTEGER
)
RETURNS TABLE ("views" INTEGER, "realViews" INTEGER)
LANGUAGE sql
AS $$
  UPDATE "Article"
     SET "views"     = COALESCE("views", 0) + p_display_inc,
         "realViews" = COALESCE("realViews", 0) + 1
   WHERE "id" = p_id
  RETURNING "views", "realViews";
$$;

-- 驗證（可選）：
-- SELECT id, title, "views", "realViews" FROM "Article" ORDER BY "realViews" DESC LIMIT 10;
