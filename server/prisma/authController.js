const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { success, badRequest, serverError } = require('../utils/response');

/**
 * 注册接口（Prisma版）
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    // 检查用户名是否存在（Prisma类型安全查询）
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return badRequest(res, '用户名已存在，请更换');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（Prisma create）
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'merchant'
      },
      // 不返回密码（安全）
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    // 统一响应格式（兼容原有ApiResponse）
    success(res, '注册成功', {
      userId: user.id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 登录接口（Prisma版）
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 查找用户（Prisma findUnique）
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) {
      return badRequest(res, '用户名或密码错误');
    }

    // 密码校验
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return badRequest(res, '用户名或密码错误');
    }

    // 生成Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // 响应（兼容原有LoginResponse类型）
    success(res, '登录成功', {
      token,
      userId: user.id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 获取当前用户信息（Prisma版）
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return badRequest(res, 'Token不能为空');
    }

    // 验证Token（原有逻辑不变）
    const decoded = verifyToken(token.replace('Bearer ', ''));
    
    // Prisma查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    if (!user) {
      return badRequest(res, '用户不存在');
    }

    success(res, '获取用户信息成功', {
      userId: user.id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    next(err);
  }
};
