const express = require('express');
const authRoutes = require('./authRoutes');
const hotelRoutes = require('./hotelRoutes');
require('dotenv').config();

const router = express.Router();
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 挂载路由
router.use('/auth', authRoutes);
router.use('/hotels', hotelRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = { router, API_PREFIX };
