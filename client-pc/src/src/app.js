const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

// 初始化应用
const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 连接数据库
connectDB();

// 全局中间件
app.use(cors()); // 跨域支持
app.use(express.json()); // 解析JSON请求体

// 挂载路由
app.use(`${API_PREFIX}/auth`, authRoutes);

// 根路由测试
app.get('/', (req, res) => {
  res.json({
    code: 200,
    msg: '智慧酒店接口服务运行正常',
    data: null
  });
});

// 全局错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 服务启动成功：http://localhost:${PORT}`);
  console.log(`📦 接口前缀：${API_PREFIX}`);
});

module.exports = app;
