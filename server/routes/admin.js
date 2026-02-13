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
} = require('../controllers/adminController')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

router.get('/hotels', authenticateToken, requireAdmin, getAdminHotels)
router.get('/hotels/:id', authenticateToken, requireAdmin, getAdminHotelById)
router.put('/hotels/:id/approve', authenticateToken, requireAdmin, approveHotel)
router.put('/hotels/:id/reject', authenticateToken, requireAdmin, rejectHotel)
router.put('/hotels/:id/publish', authenticateToken, requireAdmin, publishHotel)
router.put('/hotels/:id/offline', authenticateToken, requireAdmin, offlineHotel)
router.put('/hotels/:id/restore', authenticateToken, requireAdmin, restoreHotel)

module.exports = router
