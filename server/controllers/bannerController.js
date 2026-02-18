const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const responseHandler = require('../utils/response')
const { ResponseMessage } = require('../constants/response')

/**
 * 设置/取消 Banner
 * POST /api/admin/hotels/:id/banner
 */
const setBanner = async (req, res) => {
  try {
    const { id } = req.params
    const { isBanner, bannerSort, bannerTitle, bannerDesc } = req.body

    const hotelId = parseInt(id)

    // 查询酒店
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: {
        id: true,
        nameZh: true,
        status: true,
      },
    })

    if (!hotel) {
      return responseHandler.error(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    // 只有已发布酒店才能设为 Banner
    if (isBanner && hotel.status !== 'published') {
      return responseHandler.error(res, '只有已发布酒店才能设为 Banner', 400)
    }

    // 更新 Banner 信息
    const updateData = {
      isBanner: isBanner || false,
      updatedAt: new Date(),
    }

    // 设为 Banner 时设置其他字段
    if (isBanner) {
      updateData.bannerSort = bannerSort || 0
      updateData.bannerTitle = bannerTitle || hotel.nameZh
      updateData.bannerDesc = bannerDesc || ''
    } else {
      // 取消 Banner 时重置字段
      updateData.bannerSort = 0
      updateData.bannerTitle = null
      updateData.bannerDesc = null
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: updateData,
      select: {
        id: true,
        nameZh: true,
        status: true,
        isBanner: true,
        bannerSort: true,
        bannerTitle: true,
        bannerDesc: true,
      },
    })

    const message = isBanner ? '已设为 Banner' : '已取消 Banner'
    return responseHandler.success(res, updatedHotel, message)
  } catch (error) {
    console.error('Set banner error:', error)
    console.error('Error stack:', error.stack)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

/**
 * 更新 Banner 信息
 * PUT /api/admin/hotels/:id/banner-info
 */
const updateBannerInfo = async (req, res) => {
  try {
    const { id } = req.params
    const { bannerSort, bannerTitle, bannerDesc } = req.body

    const hotelId = parseInt(id)

    // 查询酒店
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, isBanner: true },
    })

    if (!hotel) {
      return responseHandler.error(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (!hotel.isBanner) {
      return responseHandler.error(res, '该酒店未设为 Banner', 400)
    }

    // 更新 Banner 信息
    const updateData = {
      updatedAt: new Date(),
    }
    if (bannerSort !== undefined) updateData.bannerSort = bannerSort
    if (bannerTitle !== undefined) updateData.bannerTitle = bannerTitle
    if (bannerDesc !== undefined) updateData.bannerDesc = bannerDesc

    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: updateData,
      select: {
        id: true,
        nameZh: true,
        isBanner: true,
        bannerSort: true,
        bannerTitle: true,
        bannerDesc: true,
      },
    })

    return responseHandler.success(res, updatedHotel, '更新成功')
  } catch (error) {
    console.error('Update banner info error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

/**
 * 获取 Banner 列表（移动端）
 * GET /api/banners
 */
const getBanners = async (req, res) => {
  try {
    const hotels = await prisma.hotel.findMany({
      where: {
        isBanner: true,
        status: 'published',
      },
      select: {
        id: true,
        nameZh: true,
        nameEn: true,
        bannerTitle: true,
        bannerDesc: true,
        bannerSort: true,
        images: true,
        price: true,
        starRating: true,
      },
      orderBy: { bannerSort: 'asc' },
      take: 5, // 最多5个
    })

    // 格式化返回数据
    const banners = hotels.map((hotel) => ({
      id: hotel.id,
      title: hotel.bannerTitle || hotel.nameZh,
      subtitle: hotel.bannerDesc,
      imageUrl: hotel.images?.[0] || '', // 取第一张图
      hotelId: hotel.id,
      hotelName: hotel.nameZh,
      price: hotel.price.toString(),
      starRating: hotel.starRating,
    }))

    return responseHandler.success(res, banners)
  } catch (error) {
    console.error('Get banners error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

/**
 * 获取 Banner 列表（管理后台）
 * GET /api/admin/banners
 */
const getAdminBanners = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query

    const where = {
      isBanner: true,
    }

    const [list, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        select: {
          id: true,
          nameZh: true,
          nameEn: true,
          status: true,
          bannerSort: true,
          bannerTitle: true,
          bannerDesc: true,
          images: true,
          price: true,
          starRating: true,
          updatedAt: true,
        },
        orderBy: { bannerSort: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
      }),
      prisma.hotel.count({ where }),
    ])

    // 格式化数据
    const formattedList = list.map((hotel) => ({
      id: hotel.id,
      nameZh: hotel.nameZh,
      nameEn: hotel.nameEn,
      status: hotel.status,
      bannerSort: hotel.bannerSort,
      bannerTitle: hotel.bannerTitle,
      bannerDesc: hotel.bannerDesc,
      imageUrl: hotel.images?.[0] || '',
      price: hotel.price.toString(),
      starRating: hotel.starRating,
      updatedAt: hotel.updatedAt,
    }))

    return responseHandler.success(res, {
      list: formattedList,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    })
  } catch (error) {
    console.error('Get admin banners error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

module.exports = {
  setBanner,
  updateBannerInfo,
  getBanners,
  getAdminBanners,
}
