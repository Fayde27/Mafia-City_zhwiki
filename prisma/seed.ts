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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
