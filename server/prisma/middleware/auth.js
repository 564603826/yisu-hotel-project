const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');

/**
 * 认证中间件：验证Token并解析用户信息
 */
exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return unauthorized(res, '请先登录');
    }

    // 验证Token并挂载到req.user
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (err) {
    return unauthorized(res, 'Token无效或已过期');
  }
};
