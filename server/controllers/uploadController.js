const { PrismaClient } = require('@prisma/client')
const path = require('path')
const { createUploadMiddleware, deleteImageFile, uploadDir } = require('../utils/upload')
const responseHandler = require('../utils/response')
const { ResponseMessage } = require('../constants/response')

const prisma = new PrismaClient()

// 将绝对路径转换为相对 URL 路径
const getRelativeUrl = (absolutePath) => {
  if (!absolutePath) return ''
  // 如果已经是相对路径，直接返回
  if (absolutePath.startsWith('/uploads/')) {
    return absolutePath
  }
  // 从绝对路径中提取相对路径
  const relativePath = absolutePath.replace(uploadDir, '').replace(/\\/g, '/')
  return `/uploads${relativePath}`
}

const getHotelImages = async (req, res) => {
  try {
    const hotelId = req.params.hotelId
    const { status = 'draft', type = 'hotel_main', roomType, includeArchived } = req.query

    let where = {
      hotelId: parseInt(hotelId),
      type: type,
    }

    // 只有在明确需要时才包含 archived（用于审核中的酒店查看草稿）
    if (includeArchived === 'true' && (status === 'draft' || status === 'published')) {
      where.status = { in: [status, 'archived'] }
    } else {
      where.status = status
    }

    if (roomType) {
      where.roomType = roomType
    }

    const images = await prisma.hotelimage.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    // 转换所有图片 URL 为相对路径（兼容旧数据）
    const normalizedImages = images.map((img) => ({
      ...img,
      url: getRelativeUrl(img.url),
    }))

    responseHandler.success(res, normalizedImages, ResponseMessage.SUCCESS)
  } catch (error) {
    console.error('Get hotel images error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

const uploadHotelImage = async (req, res) => {
  try {
    const hotelId = req.params.hotelId
    const userId = req.user.userId
    // 从查询参数或表单字段读取 type 和 roomType
    const type = req.query.type || req.body.type || 'hotel_main'
    const roomType = req.query.roomType || req.body.roomType || null

    const maxSortOrderResult = await prisma.hotelimage.findFirst({
      where: {
        hotelId: parseInt(hotelId),
        type: type,
        roomType: roomType || null,
        status: 'draft',
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const newSortOrder = maxSortOrderResult ? maxSortOrderResult.sortOrder + 1 : 0

    const image = await prisma.hotelimage.create({
      data: {
        hotelId: parseInt(hotelId),
        url: getRelativeUrl(req.file.path),
        type: type,
        roomType: roomType || null,
        sortOrder: newSortOrder,
        status: 'draft',
        version: 1,
        filename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    responseHandler.success(res, image, ResponseMessage.UPLOAD_SUCCESS)
  } catch (error) {
    console.error('Upload hotel image error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

const deleteHotelImage = async (req, res) => {
  try {
    const imageId = req.params.id

    const image = await prisma.hotelimage.findUnique({
      where: { id: parseInt(imageId) },
    })

    if (!image) {
      return responseHandler.error(res, ResponseMessage.NOT_FOUND)
    }

    if (image.url) {
      await deleteImageFile(image.url)
    }

    await prisma.hotelimage.delete({
      where: { id: parseInt(imageId) },
    })

    responseHandler.success(res, null, ResponseMessage.DELETE_SUCCESS)
  } catch (error) {
    console.error('Delete hotel image error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

const updateImageSortOrder = async (req, res) => {
  try {
    const { imageIds } = req.body
    const userId = req.user.userId

    for (let i = 0; i < imageIds.length; i++) {
      await prisma.hotelimage.update({
        where: { id: parseInt(imageIds[i]) },
        data: {
          sortOrder: i,
          updatedBy: userId,
        },
      })
    }

    responseHandler.success(res, null, ResponseMessage.SUCCESS)
  } catch (error) {
    console.error('Update image sort order error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

const copyPublishedToDraft = async (req, res) => {
  try {
    const hotelId = req.params.hotelId
    const userId = req.user.userId

    // 获取酒店信息，检查是否有 draftData
    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(hotelId) },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    // 如果酒店有 draftData，说明用户已经编辑过草稿，不应该再复制已发布图片
    // 即使草稿图片为空（用户删除了所有图片），也应该保持空状态
    const hasDraftData = hotel.draftData !== null && hotel.draftData !== undefined

    if (hasDraftData) {
      // 用户已经编辑过草稿，返回现有的草稿图片（可能是空数组）
      const existingDraftImages = await prisma.hotelimage.findMany({
        where: {
          hotelId: parseInt(hotelId),
          status: 'draft',
        },
      })
      const normalizedImages = existingDraftImages.map((img) => ({
        ...img,
        url: getRelativeUrl(img.url),
      }))
      return responseHandler.success(res, normalizedImages, ResponseMessage.SUCCESS)
    }

    // 检查是否已经有草稿图片（没有 draftData 但有草稿图片的情况）
    const existingDraftImages = await prisma.hotelimage.findMany({
      where: {
        hotelId: parseInt(hotelId),
        status: 'draft',
      },
    })

    if (existingDraftImages.length > 0) {
      // 已经有草稿图片，直接返回现有草稿图片
      const normalizedImages = existingDraftImages.map((img) => ({
        ...img,
        url: getRelativeUrl(img.url),
      }))
      return responseHandler.success(res, normalizedImages, ResponseMessage.SUCCESS)
    }

    const publishedImages = await prisma.hotelimage.findMany({
      where: {
        hotelId: parseInt(hotelId),
        status: 'published',
      },
    })

    if (publishedImages.length === 0) {
      return responseHandler.success(res, [], ResponseMessage.SUCCESS)
    }

    const draftImages = await Promise.all(
      publishedImages.map((img) =>
        prisma.hotelimage.create({
          data: {
            hotelId: img.hotelId,
            url: getRelativeUrl(img.url),
            type: img.type,
            roomType: img.roomType,
            sortOrder: img.sortOrder,
            status: 'draft',
            version: img.version + 1,
            filename: img.filename,
            fileSize: img.fileSize,
            mimeType: img.mimeType,
            createdBy: userId,
            updatedBy: userId,
          },
        })
      )
    )

    // 返回时统一转换为相对路径
    const normalizedImages = draftImages.map((img) => ({
      ...img,
      url: getRelativeUrl(img.url),
    }))

    responseHandler.success(res, normalizedImages, ResponseMessage.SUCCESS)
  } catch (error) {
    console.error('Copy published to draft error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

const publishImages = async (req, res) => {
  try {
    const hotelId = req.params.hotelId
    const userId = req.user.userId

    await prisma.hotelimage.updateMany({
      where: {
        hotelId: parseInt(hotelId),
        status: 'published',
      },
      data: {
        status: 'archived',
        updatedBy: userId,
      },
    })

    await prisma.hotelimage.updateMany({
      where: {
        hotelId: parseInt(hotelId),
        status: 'draft',
      },
      data: {
        status: 'published',
        updatedBy: userId,
      },
    })

    responseHandler.success(res, null, ResponseMessage.SUCCESS)
  } catch (error) {
    console.error('Publish images error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

const approveImages = async (hotelId, userId) => {
  try {
    await prisma.hotelimage.updateMany({
      where: {
        hotelId: parseInt(hotelId),
        status: 'published',
      },
      data: {
        status: 'archived',
        updatedBy: userId,
      },
    })

    await prisma.hotelimage.updateMany({
      where: {
        hotelId: parseInt(hotelId),
        status: 'draft',
      },
      data: {
        status: 'published',
        updatedBy: userId,
      },
    })
  } catch (error) {
    console.error('Approve images error:', error)
    throw error
  }
}

const getImagesForHotel = async (hotelId, status = 'published', includeArchived = false) => {
  try {
    // 构建查询条件
    let whereCondition = {
      hotelId: parseInt(hotelId),
      type: 'hotel_main',
    }

    // 只有在明确需要时才包含 archived（用于审核中的酒店查看草稿）
    if (includeArchived && (status === 'draft' || status === 'published')) {
      whereCondition.status = { in: [status, 'archived'] }
    } else {
      whereCondition.status = status
    }

    const images = await prisma.hotelimage.findMany({
      where: whereCondition,
      orderBy: { sortOrder: 'asc' },
    })
    return images.map((img) => img.url)
  } catch (error) {
    console.error('Get images for hotel error:', error)
    return []
  }
}

const getRoomImages = async (hotelId, roomType, status = 'published') => {
  try {
    const images = await prisma.hotelimage.findMany({
      where: {
        hotelId: parseInt(hotelId),
        type: 'hotel_room',
        roomType: roomType,
        status: status,
      },
      orderBy: { sortOrder: 'asc' },
    })
    return images.map((img) => img.url)
  } catch (error) {
    console.error('Get room images error:', error)
    return []
  }
}

// 驳回时处理图片 - 保留草稿图片，让商户可以继续修改
const rejectImages = async (hotelId, userId) => {
  try {
    // 驳回时不需要修改图片状态
    // 草稿图片保留，商户可以继续修改
    // 已发布的图片保持发布状态
    console.log(`Hotel ${hotelId} rejected, draft images preserved`)
  } catch (error) {
    console.error('Reject images error:', error)
    throw error
  }
}

// 同步酒店图片 - 根据提交的图片列表同步数据库
const syncHotelImages = async (req, res) => {
  try {
    const hotelId = req.params.hotelId
    const userId = req.user.userId
    const { images, type = 'hotel_main', roomType } = req.body

    // 1. 获取当前草稿图片
    const currentDraftImages = await prisma.hotelimage.findMany({
      where: {
        hotelId: parseInt(hotelId),
        type: type,
        roomType: roomType || null,
        status: 'draft',
      },
    })

    // 2. 找出需要删除的图片（在当前草稿中但不在新列表中）
    const currentUrls = currentDraftImages.map((img) => img.url)
    const newUrls = images || []
    const urlsToDelete = currentUrls.filter((url) => !newUrls.includes(url))

    // 3. 删除不在新列表中的图片
    if (urlsToDelete.length > 0) {
      await prisma.hotelimage.deleteMany({
        where: {
          hotelId: parseInt(hotelId),
          url: { in: urlsToDelete },
          status: 'draft',
        },
      })
    }

    // 4. 对新列表去重（避免传入重复URL）
    const uniqueNewUrls = [...new Set(newUrls)]

    // 5. 找出需要新增的图片（在新列表中但不在当前草稿中）
    const urlsToAdd = uniqueNewUrls.filter((url) => !currentUrls.includes(url))

    // 5. 创建新图片记录
    for (let i = 0; i < urlsToAdd.length; i++) {
      const url = urlsToAdd[i]
      const existingImage = await prisma.hotelimage.findFirst({
        where: {
          hotelId: parseInt(hotelId),
          url: url,
          status: 'draft',
        },
      })

      if (!existingImage) {
        // 从 URL 中提取文件名
        const urlParts = url.split('/')
        const filename = urlParts[urlParts.length - 1]

        await prisma.hotelimage.create({
          data: {
            hotelId: parseInt(hotelId),
            url: url,
            type: type,
            roomType: roomType || null,
            sortOrder: newUrls.indexOf(url),
            status: 'draft',
            version: 1,
            filename: filename,
            fileSize: 0,
            mimeType: 'image/png',
            createdBy: userId,
            updatedBy: userId,
          },
        })
      }
    }

    // 6. 更新排序（使用去重后的列表）
    for (let i = 0; i < uniqueNewUrls.length; i++) {
      await prisma.hotelimage.updateMany({
        where: {
          hotelId: parseInt(hotelId),
          url: uniqueNewUrls[i],
          status: 'draft',
        },
        data: {
          sortOrder: i,
          updatedBy: userId,
        },
      })
    }

    responseHandler.success(res, null, ResponseMessage.SUCCESS)
  } catch (error) {
    console.error('Sync hotel images error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

// 删除所有草稿图片（放弃草稿时调用）
const deleteAllDraftImages = async (req, res) => {
  try {
    const hotelId = req.params.hotelId
    const { type = 'hotel_main', roomType } = req.body

    // 获取要删除的草稿图片
    const draftImages = await prisma.hotelimage.findMany({
      where: {
        hotelId: parseInt(hotelId),
        type: type,
        roomType: roomType || null,
        status: 'draft',
      },
    })

    // 删除物理文件
    for (const image of draftImages) {
      if (image.url) {
        await deleteImageFile(image.url)
      }
    }

    // 删除数据库记录
    await prisma.hotelimage.deleteMany({
      where: {
        hotelId: parseInt(hotelId),
        type: type,
        roomType: roomType || null,
        status: 'draft',
      },
    })

    responseHandler.success(res, null, ResponseMessage.SUCCESS)
  } catch (error) {
    console.error('Delete all draft images error:', error)
    responseHandler.error(res, ResponseMessage.INTERNAL_SERVER_ERROR)
  }
}

// 动态创建上传中间件 - 从请求参数中获取 hotelId 和 type
const uploadMiddleware = (req, res, next) => {
  const hotelId = req.params.hotelId
  const type = req.query.type || req.body?.type || 'hotel_main'
  const roomType = req.query.roomType || req.body?.roomType || null

  const middleware = createUploadMiddleware({
    type: type,
    hotelId: hotelId,
    roomType: roomType,
  }).single('image')

  middleware(req, res, next)
}

module.exports = {
  uploadMiddleware,
  getHotelImages,
  uploadHotelImage,
  deleteHotelImage,
  updateImageSortOrder,
  copyPublishedToDraft,
  publishImages,
  approveImages,
  rejectImages,
  syncHotelImages,
  deleteAllDraftImages,
  getImagesForHotel,
  getRoomImages,
}
