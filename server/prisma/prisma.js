const { PrismaClient } = require('@prisma/client');

// 全局Prisma客户端实例（单例模式）
const prisma = new PrismaClient({
  // 开发环境打印SQL日志，便于调试
  log: process.env.NODE_ENV === 'development' ? ['query', 'info'] : []
});

// 确保客户端连接成功
prisma.$connect()
  .then(() => console.log('✅ Prisma 连接数据库成功'))
  .catch(err => console.error('❌ Prisma 连接失败:', err));

module.exports = prisma;
