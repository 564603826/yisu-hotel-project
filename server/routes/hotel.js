const express = require('express')
const router = express.Router()
const {
  getMyHotel,
  updateMyHotel,
  submitMyHotel,
  cancelSubmitMyHotel,
} = require('../controllers/hotelController')
const { authenticateToken, requireMerchant } = require('../middleware/auth')

router.get('/my', authenticateToken, requireMerchant, getMyHotel)
router.put('/my', authenticateToken, requireMerchant, updateMyHotel)
router.put('/my/submit', authenticateToken, requireMerchant, submitMyHotel)
router.put('/my/cancel', authenticateToken, requireMerchant, cancelSubmitMyHotel)

module.exports = router
