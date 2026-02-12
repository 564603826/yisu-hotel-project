const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 导入模块
const { router, API_PREFIX } = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { success } = require('./utils/response');
require('./utils/prisma'); // 初始化Prisma连接

// 初始化应用
const app = express();
const PORT = process.env.PORT || 3000;

// 全局中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 根路由
app.get('/', (req, res) => {
  success(res, '智慧酒店接口服务运行正常', {
    version: '1.0.0',
    apiPrefix: API_PREFIX,
    orm: 'Prisma 6.3.0'
  });
});

// 挂载路由
app.use(API_PREFIX, router);

// 全局错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 服务器启动成功: http://localhost:${PORT}`);
  console.log(`📚 接口前缀: ${API_PREFIX}`);
  console.log(`🔧 ORM: Prisma 6.3.0`);
});

// 进程退出时关闭Prisma连接
process.on('SIGINT', async () => {
  const prisma = require('./utils/prisma');
  await prisma.$disconnect();
  process.exit(0);
});
