const User = require('../models/User')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// 生成JWT令牌
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

/**
 * 注册接口
 * @route POST /api/v1/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body

    // 校验参数
    if (!username || !password) {
      const err = new Error('用户名和密码不能为空')
      err.statusCode = 400
      throw err
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      const err = new Error('用户名已存在，请更换')
      err.statusCode = 400
      throw err
    }

    // 创建用户
    const user = await User.create({
      username,
      password,
      role: role || 'merchant', // 默认商户角色
    })

    // 返回响应（适配 ApiResponse<UserInfo> 类型）
    res.status(200).json({
      code: 200,
      msg: '注册成功',
      data: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (err) {
    next(err) // 交给全局错误处理中间件
  }
}

/**
 * 登录接口
 * @route POST /api/v1/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    // 校验参数
    if (!username || !password) {
      const err = new Error('用户名和密码不能为空')
      err.statusCode = 400
      throw err
    }

    // 查找用户
    const user = await User.findOne({ username })
    if (!user) {
      const err = new Error('用户名或密码错误')
      err.statusCode = 400
      throw err
    }

    // 校验密码
    const isPasswordMatch = await user.comparePassword(password)
    if (!isPasswordMatch) {
      const err = new Error('用户名或密码错误')
      err.statusCode = 400
      throw err
    }

    // 生成Token
    const token = generateToken(user._id, user.role)

    // 返回响应（适配 ApiResponse<{token:string}&UserInfo> 类型）
    res.status(200).json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (err) {
    next(err)
  }
}
