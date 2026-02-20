const express = require('express')
const router = express.Router()
const mobileController = require('../controllers/mobileController')

// Banner 模块
router.get('/banners', mobileController.getBanners)

// 酒店搜索模块
router.get('/hotels/search', mobileController.searchHotels)
router.get('/hotels', mobileController.getHotelList)
router.get('/hotels/:id', mobileController.getHotelDetail)

// 筛选配置模块
router.get('/filters/options', mobileController.getFilterOptions)
router.get('/filters/tags', mobileController.getTags)

// 城市列表模块
router.get('/cities', mobileController.getCities)

module.exports = router
