const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// 用户模型（支持商户/管理员角色）
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码长度不能少于6位'],
  },
  role: {
    type: String,
    enum: ['merchant', 'admin'], // 商户/管理员
    default: 'merchant',
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
})

// 密码加密中间件（保存前自动加密）
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// 密码校验方法
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
