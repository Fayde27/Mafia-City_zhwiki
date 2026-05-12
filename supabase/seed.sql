-- ============================================================
-- 游戏攻略站 初始数据 SQL（用于 Supabase SQL Editor 执行）
-- 注意：User 表（管理员账号）需通过 npm run seed 单独创建，
--       因为密码使用 PBKDF2 加密，无法在纯 SQL 中生成。
-- ============================================================


-- ========== 第一步：清空可重复写入的数据 ==========
-- 筛选项和导航每次全量重写，避免重复
TRUNCATE "CharacterFilterOption";
TRUNCATE "BuildingFilterOption";
TRUNCATE "EquipmentFilterOption";
TRUNCATE "ItemFilterOption";
TRUNCATE "TroopFilterOption";
TRUNCATE "SidebarNav";


-- ========== 第二步：攻略文章分类 ==========
INSERT INTO "Category" (name, slug, description, icon, "sortOrder") VALUES
  ('角色图鉴', 'characters', '游戏中所有角色的详细信息', '👤', 1),
  ('武器装备', 'weapons',    '武器装备属性与获取方式',   '🔫', 2),
  ('任务攻略', 'missions',   '主线、支线任务攻略指南',   '📋', 3),
  ('地图探索', 'maps',       '各区域地图探索与收集',     '🗺️', 4),
  ('新手指南', 'guides',     '新手入门必备知识',         '📖', 5)
ON CONFLICT (slug) DO NOTHING;


-- ========== 第三步：角色分类 ==========
INSERT INTO "CharacterCategory" (name, slug, description, icon, "sortOrder") VALUES
  ('英雄', 'heroes',  '强大的英雄角色', '⚔️', 1),
  ('豪杰', 'legends', '传奇豪杰角色',   '🌟', 2)
ON CONFLICT (slug) DO NOTHING;


-- ========== 第四步：建筑分类 ==========
INSERT INTO "BuildingCategory" (name, slug, description, icon, "sortOrder") VALUES
  ('生产建筑', 'production', '资源生产类建筑', '🏭', 1),
  ('军事建筑', 'military',   '军事训练类建筑', '⚔️', 2)
ON CONFLICT (slug) DO NOTHING;


-- ========== 第五步：装备分类 ==========
INSERT INTO "EquipmentCategory" (name, slug, description, icon, "sortOrder") VALUES
  ('武器', 'equip-weapons', '攻击类装备', '🗡️', 1),
  ('防具', 'armor',         '防御类装备', '🛡️', 2)
ON CONFLICT (slug) DO NOTHING;


-- ========== 第六步：物品分类 ==========
INSERT INTO "ItemCategory" (name, slug, description, icon, "sortOrder") VALUES
  ('消耗品', 'consumables', '一次性使用道具', '🧪', 1),
  ('材料',   'materials',   '合成升级材料',   '📦', 2)
ON CONFLICT (slug) DO NOTHING;


-- ========== 第七步：兵种分类 ==========
INSERT INTO "TroopCategory" (name, slug, description, icon, "sortOrder") VALUES
  ('步兵', 'infantry', '近战步兵兵种', '👤', 1),
  ('骑兵', 'cavalry',  '快速机动兵种', '🐴', 2)
ON CONFLICT (slug) DO NOTHING;


-- ========== 第八步：示例文章 ==========
INSERT INTO "Article" (title, slug, content, summary, "categoryId", tags, "isPublished", "isPinned", "sortOrder")
SELECT
  '黑道风云角色图鉴',
  'character-guide-001',
  E'## 角色介绍\n\n这里是黑道风云的角色图鉴页面，包含所有可玩角色的详细信息。\n\n### 角色属性\n- 力量：影响近战伤害\n- 敏捷：影响闪避和暴击\n- 智力：影响技能效果\n- 体质：影响生命值\n\n### 获取方式\n通过完成主线任务或抽卡获得。',
  '黑道风云全角色详细信息图鉴',
  id,
  '角色,图鉴,攻略',
  true,
  false,
  1
FROM "Category" WHERE slug = 'characters'
ON CONFLICT (slug) DO NOTHING;


-- ========== 第九步：示例角色 ==========
INSERT INTO "Character" (
  name, slug, title, rarity, role, weapon, "coreBonus", acquisition,
  description, attributes, skills, rumors, "teamComp", "troopRec",
  "categoryId", "sortOrder", "isPublished"
)
SELECT
  '克拉拉', 'clara', '被机器人养大的女孩', 5, '毁灭', '近战', '反击增伤', '常驻跃迁',
  '克拉拉是一名毁灭命途的物理属性角色。战斗中史瓦罗会保护克拉拉，减少克拉拉受到的伤害。同时在克拉拉受到攻击时通过反击对敌方目标进行输出。',
  E'## 角色属性\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 168 | 100 | 66 |\n| 80 | 1241 | 737 | 485 |',
  E'## 技能详情\n\n### 普通攻击\n- 基础伤害：100%攻击力\n\n### 战技\n- 反击伤害：120%攻击力\n\n### 终结技\n- 范围伤害：150%攻击力',
  E'## 黑道传闻\n\n### 传闻一\n克拉拉与史瓦罗的相遇...\n\n### 传闻二\n在贝洛伯格的生活...',
  E'## 阵容搭配\n\n### 推荐阵容\n- 克拉拉 + 杰帕德 + 娜塔莎 + 希儿\n- 克拉拉 + 三月七 + 布洛妮娅 + 希儿',
  E'## 配兵推荐\n\n### 推荐配兵\n- 主C：克拉拉\n- 副C：希儿\n- 辅助：布洛妮娅\n- 生存：杰帕德',
  id, 1, true
FROM "CharacterCategory" WHERE slug = 'heroes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "Character" (
  name, slug, title, rarity, role, weapon, "coreBonus", acquisition,
  description, attributes, skills, rumors, "teamComp", "troopRec",
  "categoryId", "sortOrder", "isPublished"
)
SELECT
  'Saber', 'saber', '骑士王', 5, '毁灭', '剑', '风伤加成', '限定跃迁',
  'Saber是一名毁灭命途的风属性角色。以骑士王的身份战斗，拥有强大的近战能力和爆发输出。',
  E'## 角色属性\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 175 | 110 | 70 |\n| 80 | 1280 | 780 | 510 |',
  E'## 技能详情\n\n### 普通攻击\n- 基础伤害：110%攻击力\n\n### 战技\n- 风刃斩：130%攻击力\n\n### 终结技\n- 誓约胜利之剑：200%攻击力',
  E'## 黑道传闻\n\n### 传闻一\n骑士王阿尔托莉雅，以Saber职阶现世的从者。\n\n### 传闻二\n圆桌骑士的传说...',
  E'## 阵容搭配\n\n### 推荐阵容\n- Saber + 梅林 + 贞德 + 阿斯特赖亚\n- Saber + 孔明 + 斯卡哈 + 玛修',
  E'## 配兵推荐\n\n### 推荐配兵\n- 主C：Saber\n- 副C：斯卡哈\n- 辅助：梅林\n- 生存：玛修',
  id, 2, true
FROM "CharacterCategory" WHERE slug = 'heroes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "Character" (
  name, slug, title, rarity, role, weapon, "coreBonus", acquisition,
  description, attributes, skills, rumors, "teamComp", "troopRec",
  "categoryId", "sortOrder", "isPublished"
)
SELECT
  '刃', 'blade', '不死之刃', 5, '毁灭', '剑', '自伤增伤', '限定跃迁',
  '刃是一名毁灭命途的风属性角色。以自伤为代价换取强大的输出能力。',
  E'## 角色属性\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 180 | 115 | 65 |\n| 80 | 1300 | 800 | 490 |',
  E'## 技能详情\n\n### 普通攻击\n- 基础伤害：105%攻击力\n\n### 战技\n- 自伤攻击：140%攻击力\n\n### 终结技\n- 地狱变：180%攻击力',
  E'## 黑道传闻\n\n### 传闻一\n星核猎手成员，拥有不死之身的剑客。\n\n### 传闻二\n刃的过去...',
  E'## 阵容搭配\n\n### 推荐阵容\n- 刃 + 银狼 + 卡芙卡 + 符玄\n- 刃 + 艾丝 + 停云 + 娜塔莎',
  E'## 配兵推荐\n\n### 推荐配兵\n- 主C：刃\n- 副C：银狼\n- 辅助：卡芙卡\n- 生存：符玄',
  id, 3, true
FROM "CharacterCategory" WHERE slug = 'heroes'
ON CONFLICT (slug) DO NOTHING;


-- ========== 第十步：角色筛选选项 ==========
INSERT INTO "CharacterFilterOption" (type, value, "sortOrder") VALUES
  ('rarity', '5', 1), ('rarity', '4', 2), ('rarity', '3', 3),
  ('role', '毁灭', 1), ('role', '巡猎', 2), ('role', '智识', 3),
  ('role', '同谐', 4), ('role', '虚无', 5), ('role', '存护', 6), ('role', '丰饶', 7),
  ('weapon', '剑', 1), ('weapon', '弓', 2), ('weapon', '法杖', 3),
  ('weapon', '近战', 4), ('weapon', '枪械', 5);


-- ========== 第十一步：建筑筛选选项 ==========
INSERT INTO "BuildingFilterOption" (type, value, "sortOrder") VALUES
  ('rarity', '5', 1), ('rarity', '4', 2), ('rarity', '3', 3),
  ('rarity', '2', 4), ('rarity', '1', 5),
  ('type', '资源建筑', 1), ('type', '军事建筑', 2),
  ('type', '装饰建筑', 3), ('type', '防御建筑', 4);


-- ========== 第十二步：装备筛选选项 ==========
INSERT INTO "EquipmentFilterOption" (type, value, "sortOrder") VALUES
  ('rarity', '5', 1), ('rarity', '4', 2), ('rarity', '3', 3),
  ('rarity', '2', 4), ('rarity', '1', 5),
  ('type', '武器', 1), ('type', '防具', 2),
  ('type', '饰品', 3), ('type', '特殊装备', 4);


-- ========== 第十三步：物品筛选选项 ==========
INSERT INTO "ItemFilterOption" (type, value, "sortOrder") VALUES
  ('rarity', '5', 1), ('rarity', '4', 2), ('rarity', '3', 3),
  ('rarity', '2', 4), ('rarity', '1', 5),
  ('type', '消耗品', 1), ('type', '材料', 2),
  ('type', '任务道具', 3), ('type', '特殊道具', 4);


-- ========== 第十四步：兵种筛选选项 ==========
INSERT INTO "TroopFilterOption" (type, value, "sortOrder") VALUES
  ('rarity', '5', 1), ('rarity', '4', 2), ('rarity', '3', 3),
  ('rarity', '2', 4), ('rarity', '1', 5),
  ('type', '步兵', 1), ('type', '骑兵', 2), ('type', '弓兵', 3),
  ('type', '法师', 4), ('type', '攻城', 5);


-- ========== 第十五步：侧边栏导航 ==========
INSERT INTO "SidebarNav" (section, label, icon, href, "sortOrder", "isActive") VALUES
  ('quick-entry', '图鉴',     '📚', '/wiki',                        10, true),
  ('quick-entry', '玩法攻略', '🎮', '/wiki/guides',                  9, true),
  ('quick-entry', '游戏资讯', '📰', '/wiki/articles',                8, true),
  ('quick-entry', '角色图鉴', '👤', '/wiki/characters/characters',   7, true),
  ('quick-entry', '建筑图鉴', '🏛️', '/wiki/buildings',               6, true),
  ('quick-entry', '装备图鉴', '⚔️', '/wiki/equipment',               5, true),
  ('shortcut',    '新手入门', '🌟', '/wiki/guides',                  10, true),
  ('shortcut',    '新手必看', '👀', '/wiki/guides',                   9, true),
  ('shortcut',    '新手攻略', '📖', '/wiki/guides',                   8, true),
  ('shortcut',    '新手问答', '❓', '/wiki/guides',                   7, true),
  ('shortcut',    '常见问题', '💡', '/wiki/guides',                   6, true);


-- ========== 验证结果 ==========
SELECT 'Category'            AS "表名", COUNT(*) AS "行数" FROM "Category"
UNION ALL
SELECT 'CharacterCategory',            COUNT(*)           FROM "CharacterCategory"
UNION ALL
SELECT 'Character',                    COUNT(*)           FROM "Character"
UNION ALL
SELECT 'BuildingCategory',             COUNT(*)           FROM "BuildingCategory"
UNION ALL
SELECT 'EquipmentCategory',            COUNT(*)           FROM "EquipmentCategory"
UNION ALL
SELECT 'ItemCategory',                 COUNT(*)           FROM "ItemCategory"
UNION ALL
SELECT 'TroopCategory',                COUNT(*)           FROM "TroopCategory"
UNION ALL
SELECT 'Article',                      COUNT(*)           FROM "Article"
UNION ALL
SELECT 'CharacterFilterOption',        COUNT(*)           FROM "CharacterFilterOption"
UNION ALL
SELECT 'BuildingFilterOption',         COUNT(*)           FROM "BuildingFilterOption"
UNION ALL
SELECT 'EquipmentFilterOption',        COUNT(*)           FROM "EquipmentFilterOption"
UNION ALL
SELECT 'ItemFilterOption',             COUNT(*)           FROM "ItemFilterOption"
UNION ALL
SELECT 'TroopFilterOption',            COUNT(*)           FROM "TroopFilterOption"
UNION ALL
SELECT 'SidebarNav',                   COUNT(*)           FROM "SidebarNav";
