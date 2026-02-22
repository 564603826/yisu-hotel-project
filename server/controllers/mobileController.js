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
 * 格式化酒店列表项
 * @param {Object} hotel - 酒店原始数据
 * @returns {Object} 格式化后的酒店数据
 */
const formatHotelListItem = (hotel, images = []) => {
  const roomTypes = safeParseJson(hotel.roomTypes)
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

  // 生成标签
  const tags = []
  if (hotel.starRating >= 4) tags.push('豪华')
  if (hotel.nearbyAttractions) tags.push('景点')
  if (hotel.facilities && hotel.facilities.includes('免费停车')) tags.push('免费停车')

  // 提取设施
  const facilities = hotel.facilities || []

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
 * 安全解析 JSON 字段
 * @param {any} value - 可能是 JSON 字符串或对象的值
 * @returns {any} 解析后的对象
 */
const safeParseJson = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return []
}

/**
 * 格式化酒店详情
 * @param {Object} hotel - 酒店原始数据
 * @returns {Object} 格式化后的酒店详情
 */
const formatHotelDetail = (hotel, images = [], roomTypeImages = {}) => {
  const roomTypes = safeParseJson(hotel.roomTypes)
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

  // 生成标签
  const tags = []
  if (hotel.starRating >= 4) tags.push('豪华')
  if (hotel.starRating >= 5) tags.push('顶级')
  if (hotel.nearbyAttractions) tags.push('景点')
  if (hotel.facilities && hotel.facilities.includes('免费停车')) tags.push('免费停车')
  if (hotel.facilities && hotel.facilities.includes('游泳池')) tags.push('度假')
  if (hotel.facilities && hotel.facilities.includes('健身房')) tags.push('商务')

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

  // 格式化周边信息
  const nearby = {
    attractions: [],
    transport: [],
    malls: [],
  }

  if (hotel.nearbyAttractions) {
    nearby.attractions = hotel.nearbyAttractions.split(',').map((item) => ({
      name: item.trim(),
      distance: '',
    }))
  }

  if (hotel.nearbyTransport) {
    nearby.transport = hotel.nearbyTransport.split(',').map((item) => ({
      name: item.trim(),
      distance: '',
    }))
  }

  if (hotel.nearbyMalls) {
    nearby.malls = hotel.nearbyMalls.split(',').map((item) => ({
      name: item.trim(),
      distance: '',
    }))
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
    facilities: hotel.facilities || [],
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
 * 提取地址中的关键区域信息（省市区）
 * @param {string} address - 完整地址
 * @returns {string[]} 关键区域关键词数组
 */
const extractAddressKeywords = (address) => {
  if (!address || typeof address !== 'string') return []

  // 清理地址字符串
  const cleanAddress = address.trim()

  // 定义行政区划匹配模式
  const patterns = [
    // 匹配省/市/区/县/镇等行政区划
    /([^省]+省)?([^市]+市)?([^区]+区)?([^县]+县)?([^镇]+镇)?/,
    // 匹配常见的城市区域组合
    /([^市]+市[^区]+区)/,
  ]

  const keywords = new Set()

  // 提取各级行政区划
  // 1. 提取省（如：广东省、广西）
  const provinceMatch = cleanAddress.match(/^([^省市]+?省?)/)
  if (provinceMatch) {
    const province = provinceMatch[1].replace(/省$/, '')
    if (province.length >= 2) keywords.add(province)
  }

  // 2. 提取市（如：深圳市、深圳）
  const cityMatch = cleanAddress.match(/([^省]+?市)/)
  if (cityMatch) {
    const cityName = cityMatch[1].replace(/市$/, '')
    if (cityName.length >= 2) keywords.add(cityName)
  }

  // 3. 提取区/县（如：南山区、南山）
  const districtMatch = cleanAddress.match(/([^市区]+?[区县])/)
  if (districtMatch) {
    const district = districtMatch[1].replace(/[区县]$/, '')
    if (district.length >= 2) keywords.add(district)
  }

  // 4. 提取街道/镇（如：粤海街道、粤海）
  const streetMatch = cleanAddress.match(/([^区县]+?[街道镇])/)
  if (streetMatch) {
    const street = streetMatch[1].replace(/[街道镇]$/, '')
    if (street.length >= 2) keywords.add(street)
  }

  // 5. 添加完整地址中的连续2-4字组合作为关键词
  const minLen = 2
  const maxLen = Math.min(4, cleanAddress.length)
  for (let len = minLen; len <= maxLen; len++) {
    for (let i = 0; i <= cleanAddress.length - len; i++) {
      const segment = cleanAddress.substring(i, i + len)
      // 过滤掉纯数字或特殊字符
      if (/[\u4e00-\u9fa5]/.test(segment)) {
        keywords.add(segment)
      }
    }
  }

  return Array.from(keywords).filter((k) => k.length >= 2)
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
      facilities,
      roomTypes,
      nearbyAttractions,
      nearbyTransport,
      nearbyMalls,
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

    // 城市/地址筛选 - 支持模糊匹配
    if (city && city.trim()) {
      const keywords = extractAddressKeywords(city.trim())

      if (keywords.length > 0) {
        // 构建OR条件：任一关键词匹配即可
        where.OR = keywords.map((keyword) => ({
          address: { contains: keyword },
        }))
      } else {
        // 如果没有提取到关键词，使用原始地址进行包含匹配
        where.address = { contains: city.trim() }
      }
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

    // 设施筛选
    if (facilities) {
      const facilityList = facilities.split(',')
      list = list.filter((hotel) =>
        facilityList.every((f) => hotel.facilities && hotel.facilities.includes(f.trim()))
      )
    }

    // 房型筛选
    if (roomTypes) {
      const roomTypeList = roomTypes.split(',')
      list = list.filter((hotel) => {
        const hotelRoomTypes = safeParseJson(hotel.roomTypes)
        if (!Array.isArray(hotelRoomTypes)) return false
        const hotelRoomNames = hotelRoomTypes.map((r) => r.name)
        return roomTypeList.some((rt) => hotelRoomNames.includes(rt.trim()))
      })
    }

    // 周边景点筛选
    if (nearbyAttractions) {
      const attractionList = nearbyAttractions.split(',')
      list = list.filter((hotel) =>
        attractionList.some(
          (a) => hotel.nearbyAttractions && hotel.nearbyAttractions.includes(a.trim())
        )
      )
    }

    // 交通信息筛选
    if (nearbyTransport) {
      const transportList = nearbyTransport.split(',')
      list = list.filter((hotel) =>
        transportList.some((t) => hotel.nearbyTransport && hotel.nearbyTransport.includes(t.trim()))
      )
    }

    // 商圈筛选
    if (nearbyMalls) {
      const mallList = nearbyMalls.split(',')
      list = list.filter((hotel) =>
        mallList.some((m) => hotel.nearbyMalls && hotel.nearbyMalls.includes(m.trim()))
      )
    }

    // 排序
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'star-desc':
        list.sort((a, b) => b.starRating - a.starRating)
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
    const parsedRoomTypes = safeParseJson(hotel.roomTypes)
    if (Array.isArray(parsedRoomTypes)) {
      for (const room of parsedRoomTypes) {
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
    // 从数据库获取已发布酒店的设施、房型等数据
    const hotels = await prisma.hotel.findMany({
      where: { status: 'published' },
      select: {
        facilities: true,
        roomTypes: true,
        nearbyAttractions: true,
        nearbyTransport: true,
        nearbyMalls: true,
      },
    })

    // 提取所有设施（去重）
    const facilitiesSet = new Set()
    hotels.forEach((hotel) => {
      if (Array.isArray(hotel.facilities)) {
        hotel.facilities.forEach((f) => facilitiesSet.add(f))
      }
    })

    // 提取所有房型名称（去重）
    const roomTypesSet = new Set()
    hotels.forEach((hotel) => {
      const roomTypes = safeParseJson(hotel.roomTypes)
      if (Array.isArray(roomTypes)) {
        roomTypes.forEach((room) => {
          if (room.name) roomTypesSet.add(room.name)
        })
      }
    })

    // 提取所有周边景点（去重）
    const attractionsSet = new Set()
    hotels.forEach((hotel) => {
      if (hotel.nearbyAttractions) {
        hotel.nearbyAttractions.split(',').forEach((a) => {
          const trimmed = a.trim()
          if (trimmed) attractionsSet.add(trimmed)
        })
      }
    })

    // 提取所有交通信息（去重）
    const transportSet = new Set()
    hotels.forEach((hotel) => {
      if (hotel.nearbyTransport) {
        hotel.nearbyTransport.split(',').forEach((t) => {
          const trimmed = t.trim()
          if (trimmed) transportSet.add(trimmed)
        })
      }
    })

    // 提取所有商圈（去重）
    const mallsSet = new Set()
    hotels.forEach((hotel) => {
      if (hotel.nearbyMalls) {
        hotel.nearbyMalls.split(',').forEach((m) => {
          const trimmed = m.trim()
          if (trimmed) mallsSet.add(trimmed)
        })
      }
    })

    const options = {
      // 星级筛选
      starRatings: [
        { value: 5, label: '五星级' },
        { value: 4, label: '四星级' },
        { value: 3, label: '三星级' },
        { value: 2, label: '二星级' },
        { value: 1, label: '一星级' },
      ],
      // 价格区间
      priceRanges: [
        { min: 0, max: 200, label: '¥200以下' },
        { min: 200, max: 500, label: '¥200-500' },
        { min: 500, max: 1000, label: '¥500-1000' },
        { min: 1000, max: 2000, label: '¥1000-2000' },
        { min: 2000, max: null, label: '¥2000以上' },
      ],
      // 排序选项
      sortOptions: [
        { value: 'default', label: '综合推荐' },
        { value: 'price-asc', label: '价格从低到高' },
        { value: 'price-desc', label: '价格从高到低' },
        { value: 'star-desc', label: '星级从高到低' },
      ],
      // 设施筛选（从数据库动态获取）
      facilities: Array.from(facilitiesSet).map((f) => ({
        value: f,
        label: f,
      })),
      // 房型筛选（从数据库动态获取）
      roomTypes: Array.from(roomTypesSet).map((r) => ({
        value: r,
        label: r,
      })),
      // 周边景点（从数据库动态获取）
      nearbyAttractions: Array.from(attractionsSet).map((a) => ({
        value: a,
        label: a,
      })),
      // 交通信息（从数据库动态获取）
      nearbyTransport: Array.from(transportSet).map((t) => ({
        value: t,
        label: t,
      })),
      // 商圈（从数据库动态获取）
      nearbyMalls: Array.from(mallsSet).map((m) => ({
        value: m,
        label: m,
      })),
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
