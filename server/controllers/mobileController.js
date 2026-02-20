const { PrismaClient } = require('@prisma/client')
const responseHandler = require('../utils/response')
const { getImagesForHotel, getRoomImages } = require('./uploadController')

const prisma = new PrismaClient()

/**
 * 计算房型最低价格
 * @param {Array} roomTypes - 房型列表
 * @returns {number} 最低价格
 */
const calculateMinPrice = (roomTypes) => {
  if (!roomTypes || !Array.isArray(roomTypes) || roomTypes.length === 0) {
    return 0
  }
  const prices = roomTypes.map((room) => room.price).filter((price) => price && price > 0)
  return prices.length > 0 ? Math.min(...prices) : 0
}

/**
 * 从房型中聚合所有设施
 * @param {Array} roomTypes - 房型列表
 * @returns {Array} 去重后的设施列表
 */
const aggregateFacilities = (roomTypes) => {
  if (!roomTypes || !Array.isArray(roomTypes) || roomTypes.length === 0) {
    return []
  }
  const allFacilities = roomTypes.flatMap((room) => room.facilities || []).filter(Boolean)
  return [...new Set(allFacilities)]
}

/**
 * 生成酒店标签
 * @param {Object} hotel - 酒店数据
 * @param {Array} facilities - 设施列表
 * @returns {Array} 标签列表
 */
const generateTags = (hotel, facilities = []) => {
  const tags = []
  if (hotel.starRating >= 5) tags.push('顶级')
  else if (hotel.starRating >= 4) tags.push('豪华')
  if (hotel.nearbyAttractions) tags.push('景点')
  if (facilities.includes('免费停车')) tags.push('免费停车')
  if (facilities.includes('游泳池')) tags.push('度假')
  if (facilities.includes('健身房')) tags.push('商务')
  return tags
}

/**
 * 格式化酒店列表项
 * @param {Object} hotel - 酒店原始数据
 * @returns {Object} 格式化后的酒店数据
 */
const formatHotelListItem = (hotel, images = []) => {
  const roomTypes = hotel.roomTypes || []
  const minPrice = calculateMinPrice(roomTypes)
  const mainImage = images.length > 0 ? images[0] : ''

  // 解析优惠信息
  let discountInfo = null
  let originalPrice = null
  const discounts = hotel.discounts || []
  if (discounts.length > 0) {
    const discount = discounts[0]
    discountInfo = {
      type: discount.type || 'percentage',
      name: discount.name || '',
      value: discount.value || 0,
    }
    // 计算原价
    if (discount.type === 'percentage' && discount.value > 0) {
      originalPrice = Math.round(minPrice / (discount.value / 100))
    }
  }

  // 从房型聚合设施
  const facilities = aggregateFacilities(roomTypes)

  // 生成标签
  const tags = generateTags(hotel, facilities)

  return {
    id: hotel.id,
    nameZh: hotel.nameZh,
    nameEn: hotel.nameEn,
    address: hotel.address,
    starRating: hotel.starRating,
    price: minPrice,
    originalPrice,
    discountInfo,
    mainImage,
    images: images.slice(0, 3), // 只返回前3张图
    tags,
    facilities: facilities.slice(0, 5), // 只返回前5个设施
  }
}

/**
 * 格式化酒店详情
 * @param {Object} hotel - 酒店原始数据
 * @returns {Object} 格式化后的酒店详情
 */
const formatHotelDetail = (hotel, images = [], roomTypeImages = {}) => {
  const roomTypes = hotel.roomTypes || []
  const minPrice = calculateMinPrice(roomTypes)

  // 解析优惠信息
  let discountInfo = null
  let originalPrice = null
  const discounts = hotel.discounts || []
  if (discounts.length > 0) {
    const discount = discounts[0]
    discountInfo = {
      type: discount.type || 'percentage',
      name: discount.name || '',
      value: discount.value || 0,
      description: discount.description || '',
      startDate: discount.startDate || '',
      endDate: discount.endDate || '',
    }
    // 计算原价
    if (discount.type === 'percentage' && discount.value > 0) {
      originalPrice = Math.round(minPrice / (discount.value / 100))
    }
  }

  // 从房型聚合设施
  const facilities = aggregateFacilities(roomTypes)

  // 生成标签（使用统一的标签生成逻辑）
  const tags = generateTags(hotel, facilities)

  // 格式化房型 - 按价格从低到高排序
  const formattedRoomTypes = roomTypes
    .map((room) => {
      // 优先使用 room 对象中存储的 images，如果没有则从图片表查询
      const storedImages = room.images || []
      const queryImages = roomTypeImages[room.name] || []
      const finalImages = storedImages.length > 0 ? storedImages : queryImages

      return {
        name: room.name || '',
        price: room.price || 0,
        originalPrice: discountInfo
          ? Math.round((room.price || 0) / (discountInfo.value / 100))
          : null,
        area: room.area || 0,
        bedType: room.bedType || '',
        bedSize: room.bedSize || '',
        maxGuests: room.maxGuests || 2,
        facilities: room.facilities || [],
        images: finalImages,
        breakfast: room.breakfast || false,
      }
    })
    .sort((a, b) => a.price - b.price)

  // 格式化周边信息 - 解析多行文本格式
  // 格式示例：
  // 克拉码头
  // 直线距离540米
  // 滨海湾
  // 直线距离2.3公里
  const parseNearbyItems = (text) => {
    if (!text || text.trim() === '') return []

    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const items = []

    for (let i = 0; i < lines.length; i += 2) {
      const name = lines[i]
      const distance = lines[i + 1] || ''
      if (name) {
        items.push({ name, distance })
      }
    }

    return items
  }

  const nearby = {
    attractions: parseNearbyItems(hotel.nearbyAttractions),
    transport: parseNearbyItems(hotel.nearbyTransport),
    malls: parseNearbyItems(hotel.nearbyMalls),
  }

  return {
    id: hotel.id,
    nameZh: hotel.nameZh,
    nameEn: hotel.nameEn,
    address: hotel.address,
    starRating: hotel.starRating,
    openDate: hotel.openDate ? hotel.openDate.toISOString().split('T')[0] : '',
    description: hotel.description || '',
    price: minPrice,
    originalPrice,
    discountInfo,
    images,
    facilities,
    tags,
    nearby,
    roomTypes: formattedRoomTypes,
  }
}

/**
 * 获取 Banner 列表（从数据库读取）
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
        bannerTitle: true,
        bannerDesc: true,
        price: true,
        starRating: true,
      },
      orderBy: { bannerSort: 'asc' },
      take: 5,
    })

    // 为每个酒店获取图片
    const banners = await Promise.all(
      hotels.map(async (hotel) => {
        const images = await getImagesForHotel(hotel.id, 'published')
        return {
          id: hotel.id,
          title: hotel.bannerTitle || hotel.nameZh,
          subtitle: hotel.bannerDesc,
          imageUrl: images.length > 0 ? images[0] : '',
          hotelId: hotel.id,
        }
      })
    )

    return responseHandler.success(res, { banners }, '查询成功')
  } catch (error) {
    console.error('Get banners error:', error)
    return responseHandler.error(res, '获取Banner失败')
  }
}

/**
 * 搜索酒店（关键字搜索）
 */
const searchHotels = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query

    if (!keyword || keyword.trim() === '') {
      return responseHandler.badRequest(res, '请输入搜索关键字')
    }

    const pageNum = parseInt(page) || 1
    const pageSize = parseInt(limit) || 10
    const skip = (pageNum - 1) * pageSize

    // 构建搜索条件
    const where = {
      status: 'published',
      OR: [
        { nameZh: { contains: keyword } },
        { nameEn: { contains: keyword } },
        { address: { contains: keyword } },
      ],
    }

    // 查询总数
    const total = await prisma.hotel.count({ where })

    // 查询酒店列表
    const hotels = await prisma.hotel.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    })

    // 为每个酒店获取图片并格式化数据
    const list = await Promise.all(
      hotels.map(async (hotel) => {
        const images = await getImagesForHotel(hotel.id, 'published')
        return formatHotelListItem(hotel, images)
      })
    )

    return responseHandler.success(
      res,
      {
        list,
        pagination: {
          page: pageNum,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '查询成功'
    )
  } catch (error) {
    console.error('Search hotels error:', error)
    return responseHandler.error(res, '搜索酒店失败')
  }
}

/**
 * 获取酒店列表（支持筛选）
 */
const getHotelList = async (req, res) => {
  try {
    const {
      city,
      starRating,
      minPrice,
      maxPrice,
      tags,
      sortBy = 'default',
      page = 1,
      limit = 10,
    } = req.query

    const pageNum = parseInt(page) || 1
    const pageSize = parseInt(limit) || 10
    const skip = (pageNum - 1) * pageSize

    // 构建筛选条件
    const where = {
      status: 'published',
    }

    // 城市筛选
    if (city) {
      where.address = { contains: city }
    }

    // 星级筛选
    if (starRating) {
      const ratings = starRating
        .split(',')
        .map((r) => parseInt(r))
        .filter(Boolean)
      if (ratings.length > 0) {
        where.starRating = { in: ratings }
      }
    }

    // 查询所有符合条件的酒店
    let hotels = await prisma.hotel.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    // 为每个酒店获取图片并格式化
    let list = await Promise.all(
      hotels.map(async (hotel) => {
        const images = await getImagesForHotel(hotel.id, 'published')
        return formatHotelListItem(hotel, images)
      })
    )

    // 价格区间筛选（在内存中过滤，因为价格是从roomTypes计算的）
    if (minPrice !== undefined && minPrice !== '') {
      const min = parseFloat(minPrice)
      list = list.filter((hotel) => hotel.price >= min)
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = parseFloat(maxPrice)
      list = list.filter((hotel) => hotel.price <= max)
    }

    // 标签筛选
    if (tags) {
      const tagList = tags.split(',')
      list = list.filter((hotel) => tagList.some((tag) => hotel.tags.includes(tag.trim())))
    }

    // 排序
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      default:
        // 默认按更新时间倒序
        break
    }

    // 分页
    const total = list.length
    const paginatedList = list.slice(skip, skip + pageSize)

    return responseHandler.success(
      res,
      {
        list: paginatedList,
        pagination: {
          page: pageNum,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '查询成功'
    )
  } catch (error) {
    console.error('Get hotel list error:', error)
    return responseHandler.error(res, '获取酒店列表失败')
  }
}

/**
 * 获取酒店详情
 */
const getHotelDetail = async (req, res) => {
  try {
    const { id } = req.params

    const hotelId = parseInt(id)
    if (isNaN(hotelId)) {
      return responseHandler.badRequest(res, '酒店ID格式错误')
    }

    // 查询酒店
    const hotel = await prisma.hotel.findFirst({
      where: {
        id: hotelId,
        status: 'published',
      },
    })

    if (!hotel) {
      return responseHandler.notFound(res, '酒店不存在或未发布')
    }

    // 获取酒店主图
    const images = await getImagesForHotel(hotelId, 'published')

    // 获取每个房型的图片
    const roomTypeImages = {}
    if (hotel.roomTypes && Array.isArray(hotel.roomTypes)) {
      for (const room of hotel.roomTypes) {
        if (room.name) {
          roomTypeImages[room.name] = await getRoomImages(hotelId, room.name, 'published')
        }
      }
    }

    // 格式化数据
    const detail = formatHotelDetail(hotel, images, roomTypeImages)

    return responseHandler.success(res, detail, '查询成功')
  } catch (error) {
    console.error('Get hotel detail error:', error)
    return responseHandler.error(res, '获取酒店详情失败')
  }
}

/**
 * 获取筛选选项
 */
const getFilterOptions = async (req, res) => {
  try {
    const options = {
      starRatings: [
        { value: 5, label: '五星级' },
        { value: 4, label: '四星级' },
        { value: 3, label: '三星级' },
        { value: 2, label: '二星级' },
        { value: 1, label: '一星级' },
      ],
      priceRanges: [
        { min: 0, max: 200, label: '¥200以下' },
        { min: 200, max: 500, label: '¥200-500' },
        { min: 500, max: 1000, label: '¥500-1000' },
        { min: 1000, max: 2000, label: '¥1000-2000' },
        { min: 2000, max: null, label: '¥2000以上' },
      ],
      sortOptions: [
        { value: 'default', label: '综合推荐' },
        { value: 'price-asc', label: '价格从低到高' },
        { value: 'price-desc', label: '价格从高到低' },
      ],
    }

    return responseHandler.success(res, options, '查询成功')
  } catch (error) {
    console.error('Get filter options error:', error)
    return responseHandler.error(res, '获取筛选选项失败')
  }
}

/**
 * 获取快捷标签
 */
const getTags = async (req, res) => {
  try {
    const tags = [
      { id: 1, name: '亲子', icon: 'baby' },
      { id: 2, name: '豪华', icon: 'crown' },
      { id: 3, name: '湖景', icon: 'waves' },
      { id: 4, name: '山景', icon: 'mountain' },
      { id: 5, name: '免费停车', icon: 'car' },
      { id: 6, name: '商务', icon: 'briefcase' },
      { id: 7, name: '度假', icon: 'umbrella' },
      { id: 8, name: '网红', icon: 'camera' },
    ]

    return responseHandler.success(res, { tags }, '查询成功')
  } catch (error) {
    console.error('Get tags error:', error)
    return responseHandler.error(res, '获取标签失败')
  }
}

module.exports = {
  getBanners,
  searchHotels,
  getHotelList,
  getHotelDetail,
  getFilterOptions,
  getTags,
}
