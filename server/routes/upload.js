const express = require('express')
const router = express.Router()
const {
  uploadImage,
  uploadMultipleImages,
  uploadMiddleware,
  uploadMultipleMiddleware,
  checkHotelStatus,
} = require('../controllers/uploadController')
const { authenticateToken } = require('../middleware/auth')

router.post('/image', authenticateToken, checkHotelStatus, uploadMiddleware, uploadImage)
router.post(
  '/images',
  authenticateToken,
  checkHotelStatus,
  uploadMultipleMiddleware,
  uploadMultipleImages
)

module.exports = router
