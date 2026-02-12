const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 初始化种子数据
async function seed() {
  // 1. 创建默认管理员账号（密码：admin123）
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'admin'
    }
  });
  console.log('✅ 默认管理员创建成功：', adminUser.username);

  // 2. 创建测试商户账号（密码：merchant123）
  const merchantPassword = await bcrypt.hash('merchant123', 10);
  const merchantUser = await prisma.user.upsert({
    where: { username: 'test_merchant' },
    update: {},
    create: {
      username: 'test_merchant',
      password: merchantPassword,
      role: 'merchant'
    }
  });
  console.log('✅ 测试商户创建成功：', merchantUser.username);

  // 3. 创建测试酒店数据（关联测试商户）
  const testHotel = await prisma.hotel.upsert({
    where: { id: '65f2a7b8c9d0e1f2g3h4i5j6' }, // 固定测试ID
    update: {},
    create: {
      nameCn: '智慧酒店',
      nameEn: 'Hotel',
      star: 4,
      roomType: ['单人间', '双人间', '豪华套房'],
      price: 499.99,
      openTime: '2026-02-12',
      discount: {
        type: '节日8折',
        value: 0.8
      },
      status: 'pending',
      merchantId: merchantUser.id
    }
  });
  console.log('✅ 测试酒店创建成功：', testHotel.nameCn);

  console.log('🎉 数据库种子数据初始化完成！');
}

// 执行种子脚本并关闭连接
seed()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
