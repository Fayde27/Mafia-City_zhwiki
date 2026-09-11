-- ============================================================
-- 數據看板 — 加上「造訪次數」（2026-09）
-- 依賴：2026-09-analytics.sql、2026-09-analytics-queries.sql
--
-- 造訪次數 vs 總瀏覽：
--   總瀏覽（page）  = 每開一個頁面就 +1
--   造訪次數（visit）= 一個分頁從進站到關閉只 +1，中間看幾頁都算同一次
--   前端用 sessionStorage 判定，生命週期正好是「這個分頁開著的期間」
--
-- ⚠️ 這支要先 DROP 再建：analytics_totals 多回一個欄位，
--    Postgres 的 CREATE OR REPLACE FUNCTION 不允許改變回傳型別。
--
-- 在 Supabase SQL Editor 執行
-- ============================================================

DROP FUNCTION IF EXISTS analytics_totals(DATE, DATE);

CREATE OR REPLACE FUNCTION analytics_totals(p_from DATE, p_to DATE)
RETURNS TABLE ("totalPage" BIGINT, "totalSearch" BIGINT, "totalVisit" BIGINT)
LANGUAGE sql
AS $$
  SELECT
    COALESCE(SUM("count") FILTER (WHERE "metric" = 'page'),   0)::BIGINT,
    COALESCE(SUM("count") FILTER (WHERE "metric" = 'search'), 0)::BIGINT,
    COALESCE(SUM("count") FILTER (WHERE "metric" = 'visit'),  0)::BIGINT
  FROM "DailyStat"
  WHERE "date" BETWEEN p_from AND p_to;
$$;

-- ------------------------------------------------------------
-- 驗證（可選）
-- ------------------------------------------------------------
-- SELECT * FROM analytics_totals(CURRENT_DATE - 7, CURRENT_DATE);
