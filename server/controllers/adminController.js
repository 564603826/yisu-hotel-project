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
    // pending 状态的酒店优先获取 draft 图片，如果没有则获取 published 图片
    const hotelsWithImage = await Promise.all(
      hotels.map(async (hotel) => {
        let images = []
        if (hotel.status === 'pending') {
          // pending 状态：优先获取 draft 图片，如果没有则获取 published 图片
          const draftImages = await getImagesForHotel(hotel.id, 'draft')
          if (draftImages.length === 0) {
            images = await getImagesForHotel(hotel.id, 'published')
          } else {
            images = draftImages
          }
        } else {
          // 其他状态：获取 published 图片
          images = await getImagesForHotel(hotel.id, 'published')
        }
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
    const isPending = hotel.status === 'pending'

    // 从图片表获取酒店图片
    // 审核中状态优先获取草稿图片，已发布状态获取已发布图片
    const images = await getImagesForHotel(hotel.id, isPending ? 'draft' : 'published')
    const hotelImages = images.length > 0 ? images : await getImagesForHotel(hotel.id, 'published')

    // 获取房型数据
    // 审核中状态显示 draftData（草稿），其他状态显示 roomTypes（已发布）
    let roomTypesWithImages = isPending
      ? hotel.draftData?.roomTypes || hotel.roomTypes || []
      : hotel.roomTypes || []

    if (roomTypesWithImages.length > 0) {
      // 获取草稿房型图片
      const draftRoomImages = await prisma.hotelimage.findMany({
        where: {
          hotelId: parseInt(id),
          type: 'hotel_room',
          status: 'draft',
        },
        orderBy: { sortOrder: 'asc' },
      })

      // 获取已发布房型图片
      const publishedRoomImages = await prisma.hotelimage.findMany({
        where: {
          hotelId: parseInt(id),
          type: 'hotel_room',
          status: 'published',
        },
        orderBy: { sortOrder: 'asc' },
      })

      // 按房型分组图片 - 优先使用草稿图片，如果没有则使用已发布图片
      roomTypesWithImages = roomTypesWithImages.map((room) => {
        // 从草稿图片中获取该房型的图片
        const draftImageUrls = draftRoomImages
          .filter((img) => img.roomType === room.name)
          .map((img) => img.url)

        // 从已发布图片中获取该房型的图片
        const publishedImageUrls = publishedRoomImages
          .filter((img) => img.roomType === room.name)
          .map((img) => img.url)

        // 优先使用数据库中存储的 images，然后补充草稿图片，最后使用已发布图片
        // 这样可以避免房型名称不匹配或图片状态不一致导致图片丢失的问题
        const storedImages = room.images || []
        const finalImages =
          storedImages.length > 0
            ? storedImages
            : draftImageUrls.length > 0
              ? draftImageUrls
              : publishedImageUrls.length > 0
                ? publishedImageUrls
                : []

        return {
          ...room,
          images: finalImages,
        }
      })
    }

    const hotelWithImages = {
      ...hotel,
      images: hotelImages,
      roomTypes: roomTypesWithImages,
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

    let updateData = {
      status: 'approved',
      rejectReason: null,
      auditInfo: null,
      updatedAt: new Date(),
    }

    if (hotel.draftData) {
      // 排除不属于 hotel 表的字段（images 存储在图片表，不存储在 hotel 表）
      const { images, ...validDraftData } = hotel.draftData
      updateData = {
        ...updateData,
        ...validDraftData,
        draftData: null,
        updatedAt: new Date(), // 确保 updatedAt 不被覆盖
      }
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
