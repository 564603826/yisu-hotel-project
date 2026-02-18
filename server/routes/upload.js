const express = require('express')
const router = express.Router()
const {
  uploadMiddleware,
  getHotelImages,
  uploadHotelImage,
  deleteHotelImage,
  updateImageSortOrder,
  copyPublishedToDraft,
  publishImages,
  syncHotelImages,
  deleteAllDraftImages,
} = require('../controllers/uploadController')
const { authenticateToken } = require('../middleware/auth')

// 获取酒店图片
// GET /api/upload/hotels/:hotelId/images
// Query: status=draft|published|archived, type=hotel_main|hotel_room|hotel_banner, roomType=string
router.get('/hotels/:hotelId/images', authenticateToken, getHotelImages)

// 上传酒店图片
// POST /api/upload/hotels/:hotelId/images
// Body: form-data
//   - image: File
//   - type: string (默认 hotel_main)
//   - roomType: string (可选，房型图片时使用)
router.post(
  '/hotels/:hotelId/images',
  authenticateToken,
  uploadMiddleware.single('image'),
  uploadHotelImage
)

// 删除酒店图片
// DELETE /api/upload/images/:id
router.delete('/images/:id', authenticateToken, deleteHotelImage)

// 更新图片排序
// PUT /api/upload/images/sort
// Body: { imageIds: number[] }
router.put('/images/sort', authenticateToken, updateImageSortOrder)

// 复制已发布图片为草稿（进入编辑时）
// POST /api/upload/hotels/:hotelId/images/copy-to-draft
router.post('/hotels/:hotelId/images/copy-to-draft', authenticateToken, copyPublishedToDraft)

// 发布图片（提交审核时）
// POST /api/upload/hotels/:hotelId/images/publish
router.post('/hotels/:hotelId/images/publish', authenticateToken, publishImages)

// 同步酒店图片（保存时调用）
// POST /api/upload/hotels/:hotelId/images/sync
// Body: { images: string[], type: string, roomType: string }
router.post('/hotels/:hotelId/images/sync', authenticateToken, syncHotelImages)

// 删除所有草稿图片（放弃草稿时调用）
// DELETE /api/upload/hotels/:hotelId/images/draft
// Body: { type: string, roomType: string }
router.delete('/hotels/:hotelId/images/draft', authenticateToken, deleteAllDraftImages)

module.exports = router
