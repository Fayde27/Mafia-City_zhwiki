-- ============================================================
-- 讓線下 HTML 工具能直接讀取 Supabase 素材（只讀，不給寫）
-- 目的：其他人只要拿到 HTML 就能載入全套素材開始配隊/做圖，
--       不需要匯入 JSON 存檔、不需要登入官網後台。
-- 在 Supabase SQL Editor 執行
-- ============================================================

-- ------------------------------------------------------------
-- 一、開啟 RLS
--   ⚠️ 用 CREATE TABLE 建的表 RLS 預設是「關閉」的。
--   在 Supabase，public schema 的表若 RLS 關閉，anon 公鑰可以「讀也能寫」。
--   因此這一步同時是安全加固：開 RLS 後預設全部拒絕，再只放行 SELECT。
-- ------------------------------------------------------------
ALTER TABLE "LineupHero"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineupWeapon"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineupEmblem"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineupGenre"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineupAttr"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineupPet"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineupHeroEquip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineupEquipSet"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lineup"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteConfig"      ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 二、只放行 anon「讀取」（SELECT）
--   官網後台走 service_role，會繞過 RLS，不受影響。
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "anon_read_LineupHero"      ON "LineupHero";
CREATE POLICY "anon_read_LineupHero"      ON "LineupHero"      FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_LineupWeapon"    ON "LineupWeapon";
CREATE POLICY "anon_read_LineupWeapon"    ON "LineupWeapon"    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_LineupEmblem"    ON "LineupEmblem";
CREATE POLICY "anon_read_LineupEmblem"    ON "LineupEmblem"    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_LineupGenre"     ON "LineupGenre";
CREATE POLICY "anon_read_LineupGenre"     ON "LineupGenre"     FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_LineupAttr"      ON "LineupAttr";
CREATE POLICY "anon_read_LineupAttr"      ON "LineupAttr"      FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_LineupPet"       ON "LineupPet";
CREATE POLICY "anon_read_LineupPet"       ON "LineupPet"       FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_LineupHeroEquip" ON "LineupHeroEquip";
CREATE POLICY "anon_read_LineupHeroEquip" ON "LineupHeroEquip" FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_LineupEquipSet"  ON "LineupEquipSet";
CREATE POLICY "anon_read_LineupEquipSet"  ON "LineupEquipSet"  FOR SELECT TO anon USING (true);

-- 陣容本體：只放行已發佈的（草稿不外流）
DROP POLICY IF EXISTS "anon_read_Lineup_published" ON "Lineup";
CREATE POLICY "anon_read_Lineup_published" ON "Lineup"
  FOR SELECT TO anon USING ("isPublished" = true);

-- 全域配置：只放行陣容配置這一個 key，其餘站點設定不外流
DROP POLICY IF EXISTS "anon_read_SiteConfig_lineup" ON "SiteConfig";
CREATE POLICY "anon_read_SiteConfig_lineup" ON "SiteConfig"
  FOR SELECT TO anon USING (key = 'lineupConfig');

-- ------------------------------------------------------------
-- 三、驗證（可選）：以下查詢在 SQL Editor 應返回 rowsecurity = true
-- ------------------------------------------------------------
-- SELECT relname, relrowsecurity FROM pg_class
-- WHERE relname IN ('Lineup','LineupHero','LineupWeapon','LineupEmblem',
--                   'LineupGenre','LineupAttr','LineupPet','LineupHeroEquip',
--                   'LineupEquipSet','SiteConfig');
