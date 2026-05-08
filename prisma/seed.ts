import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员账户
  const hashedPassword = await hashPassword('admin123')
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  })

  // 创建分类
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'characters' },
      update: {},
      create: {
        name: '角色图鉴',
        slug: 'characters',
        description: '游戏中所有角色的详细信息',
        icon: '👤',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'weapons' },
      update: {},
      create: {
        name: '武器装备',
        slug: 'weapons',
        description: '武器装备属性与获取方式',
        icon: '🔫',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'missions' },
      update: {},
      create: {
        name: '任务攻略',
        slug: 'missions',
        description: '主线、支线任务攻略指南',
        icon: '📋',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'maps' },
      update: {},
      create: {
        name: '地图探索',
        slug: 'maps',
        description: '各区域地图探索与收集',
        icon: '🗺️',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'guides' },
      update: {},
      create: {
        name: '新手指南',
        slug: 'guides',
        description: '新手入门必备知识',
        icon: '📖',
        sortOrder: 5,
      },
    }),
  ])

  // 创建示例文章
  const characterCategory = categories[0]
  await prisma.article.upsert({
    where: { slug: 'character-guide-001' },
    update: {},
    create: {
      title: '黑道风云角色图鉴',
      slug: 'character-guide-001',
      content: '## 角色介绍\n\n这里是黑道风云的角色图鉴页面，包含所有可玩角色的详细信息。\n\n### 角色属性\n- 力量：影响近战伤害\n- 敏捷：影响闪避和暴击\n- 智力：影响技能效果\n- 体质：影响生命值\n\n### 获取方式\n通过完成主线任务或抽卡获得。',
      summary: '黑道风云全角色详细信息图鉴',
      coverImage: '/images/characters-cover.jpg',
      categoryId: characterCategory.id,
      tags: '角色,图鉴,攻略',
      isPublished: true,
      sortOrder: 1,
    },
  })

  console.log('数据库初始化完成！')

  // 创建角色分类
  const heroCategory = await prisma.characterCategory.upsert({
    where: { slug: 'heroes' },
    update: {},
    create: {
      name: '英雄',
      slug: 'heroes',
      description: '强大的英雄角色',
      icon: '⚔️',
      sortOrder: 1,
    },
  })

  const legendCategory = await prisma.characterCategory.upsert({
    where: { slug: 'legends' },
    update: {},
    create: {
      name: '豪杰',
      slug: 'legends',
      description: '传奇豪杰角色',
      icon: '🌟',
      sortOrder: 2,
    },
  })

  // 创建筛选选项
  await prisma.characterFilterOption.deleteMany({})
  await prisma.characterFilterOption.createMany({
    data: [
      { type: 'rarity', value: '5', sortOrder: 1 },
      { type: 'rarity', value: '4', sortOrder: 2 },
      { type: 'rarity', value: '3', sortOrder: 3 },
      { type: 'role', value: '毁灭', sortOrder: 1 },
      { type: 'role', value: '巡猎', sortOrder: 2 },
      { type: 'role', value: '智识', sortOrder: 3 },
      { type: 'role', value: '同谐', sortOrder: 4 },
      { type: 'role', value: '虚无', sortOrder: 5 },
      { type: 'role', value: '存护', sortOrder: 6 },
      { type: 'role', value: '丰饶', sortOrder: 7 },
      { type: 'weapon', value: '剑', sortOrder: 1 },
      { type: 'weapon', value: '弓', sortOrder: 2 },
      { type: 'weapon', value: '法杖', sortOrder: 3 },
      { type: 'weapon', value: '近战', sortOrder: 4 },
      { type: 'weapon', value: '枪械', sortOrder: 5 },
    ],
  })

  // 创建示例角色
  await prisma.character.upsert({
    where: { slug: 'clara' },
    update: {},
    create: {
      name: '克拉拉',
      slug: 'clara',
      title: '被机器人养大的女孩',
      avatar: '/images/characters/clara-avatar.jpg',
      banner: '/images/characters/clara-banner.jpg',
      rarity: 5,
      role: '毁灭',
      weapon: '近战',
      coreBonus: '反击增伤',
      acquisition: '常驻跃迁',
      description: '克拉拉是一名毁灭命途的物理属性角色。战斗中史瓦罗会保护克拉拉，减少克拉拉受到的伤害。同时在克拉拉受到攻击时通过反击对敌方目标进行输出。其战技会对曾经攻击过自己的目标造成额外伤害。',
      attributes: '## 角色属性\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 168 | 100 | 66 |\n| 20 | 329 | 195 | 128 |\n| 30 | 481 | 285 | 188 |\n| 40 | 633 | 376 | 247 |\n| 50 | 785 | 466 | 306 |\n| 60 | 937 | 556 | 366 |\n| 70 | 1089 | 647 | 425 |\n| 80 | 1241 | 737 | 485 |',
      skills: '## 技能详情\n\n### 普通攻击\n- 基础伤害：100%攻击力\n\n### 战技\n- 反击伤害：120%攻击力\n\n### 终结技\n- 范围伤害：150%攻击力',
      rumors: '## 黑道传闻\n\n### 传闻一\n克拉拉与史瓦罗的相遇...\n\n### 传闻二\n在贝洛伯格的生活...',
      teamComp: '## 阵容搭配\n\n### 推荐阵容\n- 克拉拉 + 杰帕德 + 娜塔莎 + 希儿\n- 克拉拉 + 三月七 + 布洛妮娅 + 希儿',
      troopRec: '## 配兵推荐\n\n### 推荐配兵\n- 主C：克拉拉\n- 副C：希儿\n- 辅助：布洛妮娅\n- 生存：杰帕德',
      categoryId: heroCategory.id,
      sortOrder: 1,
      isPublished: true,
    },
  })

  await prisma.character.upsert({
    where: { slug: 'saber' },
    update: {},
    create: {
      name: 'Saber',
      slug: 'saber',
      title: '骑士王',
      avatar: '/images/characters/saber-avatar.jpg',
      banner: '/images/characters/saber-banner.jpg',
      rarity: 5,
      role: '毁灭',
      weapon: '剑',
      coreBonus: '风伤加成',
      acquisition: '限定跃迁',
      description: 'Saber是一名毁灭命途的风属性角色。以骑士王的身份战斗，拥有强大的近战能力和爆发输出。',
      attributes: '## 角色属性\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 175 | 110 | 70 |\n| 80 | 1280 | 780 | 510 |',
      skills: '## 技能详情\n\n### 普通攻击\n- 基础伤害：110%攻击力\n\n### 战技\n- 风刃斩：130%攻击力\n\n### 终结技\n- 誓约胜利之剑：200%攻击力',
      rumors: '## 黑道传闻\n\n### 传闻一\n骑士王阿尔托莉雅，以Saber职阶现世的从者。\n\n### 传闻二\n圆桌骑士的传说...',
      teamComp: '## 阵容搭配\n\n### 推荐阵容\n- Saber + 梅林 + 贞德 + 阿斯特赖亚\n- Saber + 孔明 + 斯卡哈 + 玛修',
      troopRec: '## 配兵推荐\n\n### 推荐配兵\n- 主C：Saber\n- 副C：斯卡哈\n- 辅助：梅林\n- 生存：玛修',
      categoryId: heroCategory.id,
      sortOrder: 2,
      isPublished: true,
    },
  })

  await prisma.character.upsert({
    where: { slug: 'blade' },
    update: {},
    create: {
      name: '刃',
      slug: 'blade',
      title: '不死之刃',
      avatar: '/images/characters/blade-avatar.jpg',
      banner: '/images/characters/blade-banner.jpg',
      rarity: 5,
      role: '毁灭',
      weapon: '剑',
      coreBonus: '自伤增伤',
      acquisition: '限定跃迁',
      description: '刃是一名毁灭命途的风属性角色。以自伤为代价换取强大的输出能力。',
      attributes: '## 角色属性\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 180 | 115 | 65 |\n| 80 | 1300 | 800 | 490 |',
      skills: '## 技能详情\n\n### 普通攻击\n- 基础伤害：105%攻击力\n\n### 战技\n- 自伤攻击：140%攻击力\n\n### 终结技\n- 地狱变：180%攻击力',
      rumors: '## 黑道传闻\n\n### 传闻一\n星核猎手成员，拥有不死之身的剑客。\n\n### 传闻二\n刃的过去...',
      teamComp: '## 阵容搭配\n\n### 推荐阵容\n- 刃 + 银狼 + 卡芙卡 + 符玄\n- 刃 + 艾丝 + 停云 + 娜塔莎',
      troopRec: '## 配兵推荐\n\n### 推荐配兵\n- 主C：刃\n- 副C：银狼\n- 辅助：卡芙卡\n- 生存：符玄',
      categoryId: heroCategory.id,
      sortOrder: 3,
      isPublished: true,
    },
  })

  console.log('角色数据初始化完成！')

  // 创建建筑分类
  const buildingCat1 = await prisma.buildingCategory.upsert({
    where: { slug: 'production' },
    update: {},
    create: { name: '生产建筑', slug: 'production', description: '资源生产类建筑', icon: '🏭', sortOrder: 1 },
  })
  const buildingCat2 = await prisma.buildingCategory.upsert({
    where: { slug: 'military' },
    update: {},
    create: { name: '军事建筑', slug: 'military', description: '军事训练类建筑', icon: '⚔️', sortOrder: 2 },
  })

  // 创建装备分类
  const equipCat1 = await prisma.equipmentCategory.upsert({
    where: { slug: 'weapons' },
    update: {},
    create: { name: '武器', slug: 'weapons', description: '攻击类装备', icon: '🗡️', sortOrder: 1 },
  })
  const equipCat2 = await prisma.equipmentCategory.upsert({
    where: { slug: 'armor' },
    update: {},
    create: { name: '防具', slug: 'armor', description: '防御类装备', icon: '🛡️', sortOrder: 2 },
  })

  // 创建道具分类
  const itemCat1 = await prisma.itemCategory.upsert({
    where: { slug: 'consumables' },
    update: {},
    create: { name: '消耗品', slug: 'consumables', description: '一次性使用道具', icon: '🧪', sortOrder: 1 },
  })
  const itemCat2 = await prisma.itemCategory.upsert({
    where: { slug: 'materials' },
    update: {},
    create: { name: '材料', slug: 'materials', description: '合成升级材料', icon: '📦', sortOrder: 2 },
  })

  // 创建兵种分类
  const troopCat1 = await prisma.troopCategory.upsert({
    where: { slug: 'infantry' },
    update: {},
    create: { name: '步兵', slug: 'infantry', description: '近战步兵兵种', icon: '👤', sortOrder: 1 },
  })
  const troopCat2 = await prisma.troopCategory.upsert({
    where: { slug: 'cavalry' },
    update: {},
    create: { name: '骑兵', slug: 'cavalry', description: '快速机动兵种', icon: '🐴', sortOrder: 2 },
  })

  console.log('图鉴分类初始化完成！')

  // 创建建筑筛选选项
  await prisma.buildingFilterOption.deleteMany({})
  await prisma.buildingFilterOption.createMany({
    data: [
      { type: 'rarity', value: '5', sortOrder: 1 },
      { type: 'rarity', value: '4', sortOrder: 2 },
      { type: 'rarity', value: '3', sortOrder: 3 },
      { type: 'rarity', value: '2', sortOrder: 4 },
      { type: 'rarity', value: '1', sortOrder: 5 },
      { type: 'type', value: '资源建筑', sortOrder: 1 },
      { type: 'type', value: '军事建筑', sortOrder: 2 },
      { type: 'type', value: '装饰建筑', sortOrder: 3 },
      { type: 'type', value: '防御建筑', sortOrder: 4 },
    ],
  })

  // 创建装备筛选选项
  await prisma.equipmentFilterOption.deleteMany({})
  await prisma.equipmentFilterOption.createMany({
    data: [
      { type: 'rarity', value: '5', sortOrder: 1 },
      { type: 'rarity', value: '4', sortOrder: 2 },
      { type: 'rarity', value: '3', sortOrder: 3 },
      { type: 'rarity', value: '2', sortOrder: 4 },
      { type: 'rarity', value: '1', sortOrder: 5 },
      { type: 'type', value: '武器', sortOrder: 1 },
      { type: 'type', value: '防具', sortOrder: 2 },
      { type: 'type', value: '饰品', sortOrder: 3 },
      { type: 'type', value: '特殊装备', sortOrder: 4 },
    ],
  })

  // 创建道具筛选选项
  await prisma.itemFilterOption.deleteMany({})
  await prisma.itemFilterOption.createMany({
    data: [
      { type: 'rarity', value: '5', sortOrder: 1 },
      { type: 'rarity', value: '4', sortOrder: 2 },
      { type: 'rarity', value: '3', sortOrder: 3 },
      { type: 'rarity', value: '2', sortOrder: 4 },
      { type: 'rarity', value: '1', sortOrder: 5 },
      { type: 'type', value: '消耗品', sortOrder: 1 },
      { type: 'type', value: '材料', sortOrder: 2 },
      { type: 'type', value: '任务道具', sortOrder: 3 },
      { type: 'type', value: '特殊道具', sortOrder: 4 },
    ],
  })

  // 创建兵种筛选选项
  await prisma.troopFilterOption.deleteMany({})
  await prisma.troopFilterOption.createMany({
    data: [
      { type: 'rarity', value: '5', sortOrder: 1 },
      { type: 'rarity', value: '4', sortOrder: 2 },
      { type: 'rarity', value: '3', sortOrder: 3 },
      { type: 'rarity', value: '2', sortOrder: 4 },
      { type: 'rarity', value: '1', sortOrder: 5 },
      { type: 'type', value: '步兵', sortOrder: 1 },
      { type: 'type', value: '骑兵', sortOrder: 2 },
      { type: 'type', value: '弓兵', sortOrder: 3 },
      { type: 'type', value: '法师', sortOrder: 4 },
      { type: 'type', value: '攻城', sortOrder: 5 },
    ],
  })

  console.log('筛选选项初始化完成！')

  // 创建默认侧边栏导航数据
  await prisma.sidebarNav.deleteMany({})
  await prisma.sidebarNav.createMany({
    data: [
      // 新手快速入口
      { section: 'quick-entry', label: '图鉴', icon: '📚', href: '/wiki', sortOrder: 10, isActive: true },
      { section: 'quick-entry', label: '玩法攻略', icon: '', href: '/wiki/guides', sortOrder: 9, isActive: true },
      { section: 'quick-entry', label: '游戏资讯', icon: '📰', href: '/wiki/articles', sortOrder: 8, isActive: true },
      { section: 'quick-entry', label: '角色图鉴', icon: '', href: '/wiki/characters/characters', sortOrder: 7, isActive: true },
      { section: 'quick-entry', label: '建筑图鉴', icon: '', href: '/wiki/buildings', sortOrder: 6, isActive: true },
      { section: 'quick-entry', label: '装备图鉴', icon: '️', href: '/wiki/equipment', sortOrder: 5, isActive: true },
      // 快捷功能
      { section: 'shortcut', label: '新手入门', icon: '', href: '/wiki/guides', sortOrder: 10, isActive: true },
      { section: 'shortcut', label: '新手必看', icon: '', href: '/wiki/guides', sortOrder: 9, isActive: true },
      { section: 'shortcut', label: '新手攻略', icon: '', href: '/wiki/guides', sortOrder: 8, isActive: true },
      { section: 'shortcut', label: '新手问答', icon: '', href: '/wiki/guides', sortOrder: 7, isActive: true },
      { section: 'shortcut', label: '常见问题', icon: '', href: '/wiki/guides', sortOrder: 6, isActive: true },
    ],
  })

  console.log('侧边栏导航初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
