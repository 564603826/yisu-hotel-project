const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { generateToken } = require('../utils/jwt')
const responseHandler = require('../utils/response')
const { ResponseCode, ResponseMessage } = require('../constants/response')

// Initialize Prisma Client
const prisma = new PrismaClient()

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password || !role) {
      return responseHandler.badRequest(res, ResponseMessage.MISSING_FIELDS)
    }

    if (role !== 'merchant' && role !== 'admin') {
      return responseHandler.badRequest(res, ResponseMessage.INVALID_ROLE)
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return responseHandler.badRequest(res, ResponseMessage.INVALID_USERNAME)
    }

    if (password.length < 6 || password.length > 20) {
      return responseHandler.badRequest(res, ResponseMessage.INVALID_PASSWORD_LENGTH)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
    })

    const { password: _, ...userWithoutPassword } = user

    return responseHandler.success(
      res,
      userWithoutPassword,
      ResponseMessage.REGISTER_SUCCESS,
      ResponseCode.CREATED
    )
  } catch (error) {
    if (error.code === 'P2002') {
      return responseHandler.conflict(res, ResponseMessage.USER_ALREADY_EXISTS)
    }

    console.error('Registration error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

// Login user
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return responseHandler.badRequest(res, ResponseMessage.MISSING_FIELDS)
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return responseHandler.unauthorized(res, ResponseMessage.INVALID_PASSWORD)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return responseHandler.unauthorized(res, ResponseMessage.INVALID_PASSWORD)
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    const { password: _, ...userWithoutPassword } = user

    return responseHandler.success(
      res,
      {
        token,
        userInfo: {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
      },
      ResponseMessage.LOGIN_SUCCESS
    )
  } catch (error) {
    console.error('Login error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

module.exports = {
  registerUser,
  loginUser,
}
