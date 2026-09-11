-- ============================================================
-- 數據看板 — 聚合查詢函數（2026-09）
-- 依賴：先執行 2026-09-analytics.sql（建表）
--
-- 為什麼要用 SQL 函數而不是撈回前端算：
--   PostgREST 預設單次最多回 1000 列。一年的 DailyStat 有數萬列，
--   撈回前端聚合會被靜默截斷、數字直接是錯的。聚合一律放 DB 側。
--
-- 在 Supabase SQL Editor 執行（純新增函數，無破壞性操作）
-- ============================================================

-- ------------------------------------------------------------
-- 一、總覽數字
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_totals(p_from DATE, p_to DATE)
RETURNS TABLE ("totalPage" BIGINT, "totalSearch" BIGINT)
LANGUAGE sql
AS $$
  SELECT
    COALESCE(SUM("count") FILTER (WHERE "metric" = 'page'), 0)::BIGINT,
    COALESCE(SUM("count") FILTER (WHERE "metric" = 'search'), 0)::BIGINT
  FROM "DailyStat"
  WHERE "date" BETWEEN p_from AND p_to;
$$;

-- ------------------------------------------------------------
-- 二、模塊對比（metric = page，key 為路徑前綴）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_modules(p_from DATE, p_to DATE)
RETURNS TABLE ("key" TEXT, "count" BIGINT)
LANGUAGE sql
AS $$
  SELECT "key", SUM("count")::BIGINT AS "count"
  FROM "DailyStat"
  WHERE "metric" = 'page' AND "date" BETWEEN p_from AND p_to
  GROUP BY "key"
  ORDER BY "count" DESC;
$$;

-- ------------------------------------------------------------
-- 三、按天趨勢（整站 PV）
--   用 generate_series 補齊沒有資料的日子，否則折線圖會把
--   「那天沒人來」畫成直線連過去，看起來像沒掉
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_trend(p_from DATE, p_to DATE)
RETURNS TABLE ("date" DATE, "count" BIGINT)
LANGUAGE sql
AS $$
  SELECT d::DATE,
         COALESCE(SUM(s."count"), 0)::BIGINT
  FROM generate_series(p_from, p_to, '1 day') AS d
  LEFT JOIN "DailyStat" s
    ON s."date" = d::DATE AND s."metric" = 'page'
  GROUP BY d
  ORDER BY d;
$$;

-- ------------------------------------------------------------
-- 四、內容排行（p_metric = article / item / event / lineup）
--   只回 id 與次數，名稱由 API 端另查（避免這裡寫死表結構）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_top_content(
  p_metric TEXT,
  p_from   DATE,
  p_to     DATE,
  p_limit  INTEGER DEFAULT 10
)
RETURNS TABLE ("key" TEXT, "count" BIGINT)
LANGUAGE sql
AS $$
  SELECT "key", SUM("count")::BIGINT AS "count"
  FROM "DailyStat"
  WHERE "metric" = p_metric AND "date" BETWEEN p_from AND p_to
  GROUP BY "key"
  ORDER BY "count" DESC
  LIMIT p_limit;
$$;

-- ------------------------------------------------------------
-- 五、熱搜詞
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_search_top(
  p_from  DATE,
  p_to    DATE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE ("keyword" TEXT, "count" BIGINT)
LANGUAGE sql
AS $$
  SELECT "keyword", SUM("count")::BIGINT AS "count"
  FROM "SearchLog"
  WHERE "date" BETWEEN p_from AND p_to
  GROUP BY "keyword"
  ORDER BY "count" DESC
  LIMIT p_limit;
$$;

-- ------------------------------------------------------------
-- 六、⚠️「搜了但沒結果」清單 —— 看板唯一能直接驅動行動的產出
--   判定：這個詞在整個區間內「從來沒有」搜出過結果
--   （不是某一天沒有，避免內容補上之後舊紀錄還一直掛在清單上）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_search_noresult(
  p_from  DATE,
  p_to    DATE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE ("keyword" TEXT, "count" BIGINT)
LANGUAGE sql
AS $$
  SELECT "keyword", SUM("count")::BIGINT AS "count"
  FROM "SearchLog"
  WHERE "date" BETWEEN p_from AND p_to
  GROUP BY "keyword"
  HAVING BOOL_OR("hasResult") = false
  ORDER BY "count" DESC
  LIMIT p_limit;
$$;

-- ------------------------------------------------------------
-- 七、資料起始日（給「全部」區間用）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics_first_date()
RETURNS DATE
LANGUAGE sql
AS $$
  SELECT LEAST(
    (SELECT MIN("date") FROM "DailyStat"),
    (SELECT MIN("date") FROM "SearchLog")
  );
$$;

-- ------------------------------------------------------------
-- 驗證（可選）
-- ------------------------------------------------------------
-- SELECT * FROM analytics_totals(CURRENT_DATE - 7, CURRENT_DATE);
-- SELECT * FROM analytics_modules(CURRENT_DATE - 7, CURRENT_DATE);
-- SELECT * FROM analytics_trend(CURRENT_DATE - 7, CURRENT_DATE);
-- SELECT * FROM analytics_top_content('item', CURRENT_DATE - 7, CURRENT_DATE, 10);
-- SELECT * FROM analytics_search_noresult(CURRENT_DATE - 30, CURRENT_DATE, 20);
