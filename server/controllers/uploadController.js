const { PrismaClient } = require('@prisma/client')
const { upload, getImageUrl } = require('../utils/upload')
const responseHandler = require('../utils/response')
const { ResponseMessage } = require('../constants/response')

const prisma = new PrismaClient()

const getStatusMessage = (status) => {
  const statusMap = {
    draft: '草稿',
    pending: '审核中',
    approved: '审核通过',
    rejected: '审核不通过',
    published: '已发布',
    offline: '已下线',
  }
  return statusMap[status] || status
}

const checkHotelStatus = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next()
    }

    const hotel = await prisma.hotel.findUnique({
      where: { creatorId: req.user.userId },
    })

    if (!hotel) {
      return responseHandler.badRequest(res, '您还没有酒店信息')
    }

    const allowedStatuses = ['draft', 'rejected', 'published', 'offline']
    if (!allowedStatuses.includes(hotel.status)) {
      return responseHandler.badRequest(
        res,
        `当前酒店状态为「${getStatusMessage(hotel.status)}」，只有草稿、审核不通过、已发布或已下线状态才能上传图片`
      )
    }

    next()
  } catch (error) {
    console.error('Check hotel status error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return responseHandler.badRequest(res, '请选择要上传的文件')
    }

    const imageUrl = getImageUrl(req.file.filename)

    return responseHandler.success(
      res,
      {
        url: imageUrl,
        filename: req.file.filename,
      },
      ResponseMessage.UPLOAD_SUCCESS
    )
  } catch (error) {
    console.error('Upload error:', error)
    return responseHandler.error(res, ResponseMessage.UPLOAD_FAILED)
  }
}

const uploadMultipleImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return responseHandler.badRequest(res, '请选择要上传的文件')
    }

    const urls = req.files.map((file) => ({
      url: getImageUrl(file.filename),
      filename: file.filename,
    }))

    return responseHandler.success(res, urls, ResponseMessage.UPLOAD_SUCCESS)
  } catch (error) {
    console.error('Upload error:', error)
    return responseHandler.error(res, ResponseMessage.UPLOAD_FAILED)
  }
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
  uploadMiddleware: upload.single('image'),
  uploadMultipleMiddleware: upload.array('images', 10),
  checkHotelStatus,
}
