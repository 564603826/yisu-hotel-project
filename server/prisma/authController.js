const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { success, badRequest } = require('../utils/response');

// 初始化Prisma客户端
const prisma = new PrismaClient();

/**
 * 注册接口控制器（Prisma版）
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    // 检查用户名是否存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return badRequest(res, '用户名已存在，请更换');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（Prisma类型安全）
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'merchant'
      }
    });

    // 返回响应
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
 * 登录接口控制器（Prisma版）
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) {
      return badRequest(res, '用户名或密码错误');
    }

    // 校验密码
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

    // 返回响应
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
