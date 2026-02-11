const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/authController')

// 注册接口
router.post('/register', register)

// 登录接口
router.post('/login', login)

module.exports = router
