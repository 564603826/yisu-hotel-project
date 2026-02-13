const { verifyToken } = require('../utils/jwt')
const responseHandler = require('../utils/response')
const { ResponseMessage } = require('../constants/response')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return responseHandler.unauthorized(res, 'Access token required')
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return responseHandler.forbidden(res, 'Invalid or expired token')
  }
}

const requireMerchant = (req, res, next) => {
  if (req.user.role !== 'merchant') {
    return responseHandler.forbidden(res, '此操作需要商户权限')
  }
  next()
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return responseHandler.forbidden(res, '此操作需要管理员权限')
  }
  next()
}

module.exports = {
  authenticateToken,
  requireMerchant,
  requireAdmin,
}
