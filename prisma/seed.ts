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
      path: '毁灭',
      faction: '贝洛伯格',
      combatType: '物理',
      gender: '女',
      releaseDate: '2023年04月26日',
      weapon: '近战',
      tags: '反击,追加攻击,物理输出',
      description: '克拉拉是一名毁灭命途的物理属性角色。战斗中史瓦罗会保护克拉拉，减少克拉拉受到的伤害。同时在克拉拉受到攻击时通过反击对敌方目标进行输出。其战技会对曾经攻击过自己的目标造成额外伤害。',
      stats: '## 属性数据\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 168 | 100 | 66 |\n| 20 | 329 | 195 | 128 |\n| 30 | 481 | 285 | 188 |\n| 40 | 633 | 376 | 247 |\n| 50 | 785 | 466 | 306 |\n| 60 | 937 | 556 | 366 |\n| 70 | 1089 | 647 | 425 |\n| 80 | 1241 | 737 | 485 |',
      materials: '## 晋升材料\n\n### 20级\n- 古代零件 x5\n- 信用点 x4000\n\n### 30级\n- 古代零件 x10\n- 信用点 x8000\n\n### 40级\n- 铁卫勋章 x3\n- 古代转轴 x6\n- 信用点 x16000',
      story: '## 角色故事\n\n### 角色详情\n被机器人养大的女孩，有着超越年龄的通透和坚持。对克拉拉而言，史瓦罗理性的计算是世界法则，绝不会出错。直到发现「计算」得到的结果，并不一定能带给大家幸福。怯生生的女孩决定勇敢起来。\n\n### 角色故事·一（解锁条件：角色等级20）\n克拉拉与史瓦罗的相遇...\n\n### 角色故事·二（解锁条件：角色等级40）\n在贝洛伯格的生活...',
      otherInfo: '## 其他信息\n\n### 昵称/外号\n- 克拉拉\n- 史瓦罗\n\n### 身份\n贝洛伯格与机械为伴的少女\n\n### 体型\n少女\n\n### 种族\n人类',
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
      path: '毁灭',
      faction: '圆桌骑士',
      combatType: '风',
      gender: '女',
      releaseDate: '2023年05月01日',
      weapon: '剑',
      tags: '风属性,近战,爆发',
      description: 'Saber是一名毁灭命途的风属性角色。以骑士王的身份战斗，拥有强大的近战能力和爆发输出。',
      stats: '## 属性数据\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 175 | 110 | 70 |\n| 80 | 1280 | 780 | 510 |',
      materials: '## 晋升材料\n\n### 20级\n- 风之碎片 x5\n- 信用点 x4000',
      story: '## 角色故事\n\n### 角色详情\n骑士王阿尔托莉雅，以Saber职阶现世的从者。',
      otherInfo: '## 其他信息\n\n### 真名\n阿尔托莉雅·潘德拉贡',
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
      path: '毁灭',
      faction: '星核猎手',
      combatType: '风',
      gender: '男',
      releaseDate: '2023年07月19日',
      weapon: '剑',
      tags: '风属性,自伤,爆发',
      description: '刃是一名毁灭命途的风属性角色。以自伤为代价换取强大的输出能力。',
      stats: '## 属性数据\n\n| 等级 | 生命值 | 攻击力 | 防御力 |\n|------|--------|--------|--------|\n| 1 | 180 | 115 | 65 |\n| 80 | 1300 | 800 | 490 |',
      materials: '## 晋升材料\n\n### 20级\n- 风之碎片 x5\n- 信用点 x4000',
      story: '## 角色故事\n\n### 角色详情\n星核猎手成员，拥有不死之身的剑客。',
      otherInfo: '## 其他信息\n\n### 身份\n星核猎手',
      categoryId: heroCategory.id,
      sortOrder: 3,
      isPublished: true,
    },
  })

  console.log('角色数据初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
