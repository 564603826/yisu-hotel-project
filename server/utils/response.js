const responseHandler = {
  success(res, data = null, msg = '操作成功', code = 200) {
    return res.status(code).json({
      code,
      msg,
      data,
    })
  },

  error(res, msg = '操作失败', code = 500, data = null) {
    return res.status(code).json({
      code,
      msg,
      data,
    })
  },

  badRequest(res, msg = '请求参数错误', data = null) {
    return this.error(res, msg, 400, data)
  },

  unauthorized(res, msg = '未授权', data = null) {
    return this.error(res, msg, 401, data)
  },

  forbidden(res, msg = '禁止访问', data = null) {
    return this.error(res, msg, 403, data)
  },

  notFound(res, msg = '资源不存在', data = null) {
    return this.error(res, msg, 404, data)
  },

  conflict(res, msg = '资源冲突', data = null) {
    return this.error(res, msg, 409, data)
  },
}

module.exports = responseHandler
