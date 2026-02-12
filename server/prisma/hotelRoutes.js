const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { authMiddleware } = require('../middleware/auth'); // 需补充认证中间件

// 商户酒店操作
router.post('/', authMiddleware, hotelController.createHotel); // 新增
router.put('/:hotelId', authMiddleware, hotelController.updateHotel); // 编辑
router.delete('/:hotelId', authMiddleware, hotelController.deleteHotel); // 删除
router.get('/my', authMiddleware, hotelController.getMerchantHotels); // 商户自有列表

// 酒店详情
router.get('/:hotelId', authMiddleware, hotelController.getHotelDetail);

// 管理员操作
router.post('/:hotelId/review', authMiddleware, hotelController.reviewHotel); // 审核
router.post('/:hotelId/status', authMiddleware, hotelController.changeHotelStatus); // 上下线

// 分页查询
router.get('/', authMiddleware, hotelController.getHotelList); // 管理员/用户端分页

module.exports = router;
