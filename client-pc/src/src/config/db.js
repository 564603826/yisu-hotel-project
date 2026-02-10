const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 数据库连接成功');
  } catch (err) {
    console.error('❌ 数据库连接失败：', err.message);
    process.exit(1); // 连接失败退出进程
  }
};

module.exports = connectDB;
