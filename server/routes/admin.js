const express = require('express')
const router = express.Router()
const {
  getAdminHotels,
  getAdminHotelById,
  approveHotel,
  rejectHotel,
  publishHotel,
  offlineHotel,
  restoreHotel,
  getDashboardStats,
} = require('../controllers/adminController')
const { setBanner, updateBannerInfo, getAdminBanners } = require('../controllers/bannerController')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

// 酒店管理
router.get('/hotels', authenticateToken, requireAdmin, getAdminHotels)
router.get('/hotels/:id', authenticateToken, requireAdmin, getAdminHotelById)
router.put('/hotels/:id/approve', authenticateToken, requireAdmin, approveHotel)
router.put('/hotels/:id/reject', authenticateToken, requireAdmin, rejectHotel)
router.put('/hotels/:id/publish', authenticateToken, requireAdmin, publishHotel)
router.put('/hotels/:id/offline', authenticateToken, requireAdmin, offlineHotel)
router.put('/hotels/:id/restore', authenticateToken, requireAdmin, restoreHotel)

// Banner 管理
router.get('/banners', authenticateToken, requireAdmin, getAdminBanners)
router.put('/hotels/:id/banner', authenticateToken, requireAdmin, setBanner)
router.put('/hotels/:id/banner-info', authenticateToken, requireAdmin, updateBannerInfo)

// Dashboard 统计
router.get('/dashboard/stats', authenticateToken, requireAdmin, getDashboardStats)

module.exports = router
