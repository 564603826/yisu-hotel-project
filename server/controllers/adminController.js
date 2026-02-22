const { PrismaClient } = require('@prisma/client')
const responseHandler = require('../utils/response')
const { ResponseCode, ResponseMessage } = require('../constants/response')
const { getImagesForHotel, approveImages, rejectImages } = require('./uploadController')

const prisma = new PrismaClient()

const getAdminHotels = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword } = req.query

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const take = parseInt(pageSize)

    const where = {}

    if (status) {
      where.status = status
    }

    if (keyword) {
      where.nameZh = {
        contains: keyword,
      }
    }

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.hotel.count({ where }),
    ])

    // 为每个酒店获取图片
    // pending（待审核）和 rejected（已驳回）状态显示草稿图片（包括空数组的情况）
    // 其他状态显示已发布图片
    const hotelsWithImage = await Promise.all(
      hotels.map(async (hotel) => {
        const isDraftVersion = hotel.status === 'pending' || hotel.status === 'rejected'
        const images = await getImagesForHotel(hotel.id, isDraftVersion ? 'draft' : 'published')
        return {
          ...hotel,
          images,
          image: images.length > 0 ? images[0] : null,
        }
      })
    )

    return responseHandler.success(
      res,
      {
        list: hotelsWithImage,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      },
      ResponseMessage.HOTEL_QUERY_SUCCESS
    )
  } catch (error) {
    console.error('Get admin hotels error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const getAdminHotelById = async (req, res) => {
  try {
    const { id } = req.params

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    // 根据酒店状态决定显示什么数据
    // pending（待审核）和 rejected（已驳回）状态都显示 draftData（草稿版本）
    const isDraftVersion = hotel.status === 'pending' || hotel.status === 'rejected'

    // 从图片表获取酒店图片 - 同时获取草稿和已发布两种版本的图片
    // 这样可以支持管理员在审核时对比上线版本
    const draftHotelImages = await getImagesForHotel(hotel.id, 'draft')
    const publishedHotelImages = await getImagesForHotel(hotel.id, 'published')
    // 默认显示草稿图片（审核版本）
    const hotelImages = isDraftVersion ? draftHotelImages : publishedHotelImages

    // 获取草稿和已发布两种版本的房型数据
    // 草稿版本：优先使用 draftData 中的房型数据
    const hasDraftData = hotel.draftData !== undefined && hotel.draftData !== null
    const draftRoomTypes = hasDraftData ? hotel.draftData?.roomTypes || [] : hotel.roomTypes || []
    // 已发布版本：使用 hotel.roomTypes
    const publishedRoomTypes = hotel.roomTypes || []

    // 获取草稿和已发布房型图片
    const draftRoomImages = await prisma.hotelimage.findMany({
      where: {
        hotelId: parseInt(id),
        type: 'hotel_room',
        status: 'draft',
      },
      orderBy: { sortOrder: 'asc' },
    })

    const publishedRoomImages = await prisma.hotelimage.findMany({
      where: {
        hotelId: parseInt(id),
        type: 'hotel_room',
        status: 'published',
      },
      orderBy: { sortOrder: 'asc' },
    })

    // 处理草稿版本房型数据（使用草稿图片）
    const draftRoomTypesWithImages = draftRoomTypes.map((room) => {
      const draftImageUrls = draftRoomImages
        .filter((img) => img.roomType === room.name)
        .map((img) => img.url)

      const storedImages = room.images || []
      const finalImages = storedImages.length > 0 ? storedImages : draftImageUrls

      return {
        ...room,
        images: finalImages,
      }
    })

    // 处理已发布版本房型数据（使用已发布图片）
    const publishedRoomTypesWithImages = publishedRoomTypes.map((room) => {
      const publishedImageUrls = publishedRoomImages
        .filter((img) => img.roomType === room.name)
        .map((img) => img.url)

      const storedImages = room.images || []
      const finalImages = storedImages.length > 0 ? storedImages : publishedImageUrls

      return {
        ...room,
        images: finalImages,
      }
    })

    // 默认显示草稿版本房型
    const roomTypesWithImages = isDraftVersion
      ? draftRoomTypesWithImages
      : publishedRoomTypesWithImages

    const hotelWithImages = {
      ...hotel,
      images: hotelImages,
      roomTypes: roomTypesWithImages,
      // 额外返回两种版本的图片和房型数据，支持管理员对比
      _draftImages: draftHotelImages,
      _publishedImages: publishedHotelImages,
      _draftRoomTypes: draftRoomTypesWithImages,
      _publishedRoomTypes: publishedRoomTypesWithImages,
    }

    return responseHandler.success(res, hotelWithImages, ResponseMessage.HOTEL_QUERY_SUCCESS)
  } catch (error) {
    console.error('Get admin hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const approveHotel = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (hotel.status !== 'pending') {
      return responseHandler.badRequest(res, ResponseMessage.APPROVE_PENDING_ONLY)
    }

    await approveImages(id, userId)

    // 排除不属于 hotel 表的字段（images 存储在图片表，不存储在 hotel 表）
    const { images: draftImages, ...validDraftData } = hotel.draftData || {}

    const updateData = {
      status: 'approved',
      rejectReason: null,
      auditInfo: null,
      updatedAt: new Date(),
      // 如果有草稿数据，合并到主表；无论是否有草稿数据，都清空 draftData
      ...(hotel.draftData ? validDraftData : {}),
      draftData: null,
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    // 获取更新后的图片
    const images = await getImagesForHotel(id, 'published')
    const hotelWithImages = {
      ...updatedHotel,
      images,
    }

    return responseHandler.success(res, hotelWithImages, ResponseMessage.HOTEL_APPROVE_SUCCESS)
  } catch (error) {
    console.error('Approve hotel error:', error)
    console.error('Error stack:', error.stack)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const rejectHotel = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason) {
      return responseHandler.badRequest(res, '请填写不通过原因')
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (hotel.status !== 'pending') {
      return responseHandler.badRequest(res, ResponseMessage.APPROVE_PENDING_ONLY)
    }

    const previousStatus = hotel.draftData ? 'published' : 'draft'

    const updatedHotel = await prisma.hotel.update({
      where: { id: parseInt(id) },
      data: {
        status: 'rejected',
        rejectReason: reason,
        auditInfo: null,
        updatedAt: new Date(),
      },
    })

    // 驳回时处理图片 - 保留草稿图片让商户可以继续修改
    await rejectImages(id, req.user.userId)

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_REJECT_SUCCESS)
  } catch (error) {
    console.error('Reject hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const publishHotel = async (req, res) => {
  try {
    const { id } = req.params

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (hotel.status !== 'approved') {
      return responseHandler.badRequest(res, ResponseMessage.PUBLISH_APPROVED_ONLY)
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: parseInt(id) },
      data: {
        status: 'published',
        updatedAt: new Date(),
      },
    })

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_PUBLISH_SUCCESS)
  } catch (error) {
    console.error('Publish hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const offlineHotel = async (req, res) => {
  try {
    const { id } = req.params

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (hotel.status !== 'published') {
      return responseHandler.badRequest(res, ResponseMessage.OFFLINE_PUBLISHED_ONLY)
    }

    // 下线酒店时，如果该酒店是 Banner，则自动取消 Banner 设置
    const updateData = {
      status: 'offline',
      updatedAt: new Date(),
    }

    if (hotel.isBanner) {
      updateData.isBanner = false
      updateData.bannerSort = 0
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_OFFLINE_SUCCESS)
  } catch (error) {
    console.error('Offline hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const restoreHotel = async (req, res) => {
  try {
    const { id } = req.params

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (hotel.status !== 'offline') {
      return responseHandler.badRequest(res, ResponseMessage.RESTORE_OFFLINE_ONLY)
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: parseInt(id) },
      data: {
        status: 'published',
        updatedAt: new Date(),
      },
    })

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_RESTORE_SUCCESS)
  } catch (error) {
    console.error('Restore hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

// 获取 Dashboard 统计数据
const getDashboardStats = async (req, res) => {
  try {
    // 获取今日开始时间
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 并行获取统计数据
    const [pendingCount, todayApprovedCount, totalHotels] = await Promise.all([
      // 待审核数量
      prisma.hotel.count({
        where: { status: 'pending' },
      }),
      // 今日通过数量（今日审核通过的：状态为 approved/published/offline 且今日更新）
      // 注意：审核通过后状态会变成 approved，发布后会变成 published，下线后会变成 offline
      prisma.hotel.count({
        where: {
          status: {
            in: ['approved', 'published', 'offline'],
          },
          updatedAt: {
            gte: today,
          },
        },
      }),
      // 平台收录总数（已发布 + 已下线）
      prisma.hotel.count({
        where: {
          status: {
            in: ['published', 'offline'],
          },
        },
      }),
    ])

    return responseHandler.success(
      res,
      {
        pendingCount,
        todayApprovedCount,
        totalHotels,
        lastUpdateTime: new Date().toISOString(),
      },
      '获取统计数据成功'
    )
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

module.exports = {
  getAdminHotels,
  getAdminHotelById,
  approveHotel,
  rejectHotel,
  publishHotel,
  offlineHotel,
  restoreHotel,
  getDashboardStats,
}
