const { PrismaClient } = require('@prisma/client')
const responseHandler = require('../utils/response')
const { getImagesForHotel, getRoomImages } = require('./uploadController')

const prisma = new PrismaClient()

/**
 * 验证日期格式是否有效（YYYY-MM-DD）
 * @param {string} dateString - 日期字符串
 * @returns {boolean} 是否有效
 */
const isValidDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0]
}

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
 * 计算单个优惠后的价格
 * @param {number} originalPrice - 原始价格
 * @param {Object} discount - 优惠信息
 * @returns {number} 优惠后价格
 */
const calculateDiscountedPrice = (originalPrice, discount) => {
  if (!discount || !discount.type || !discount.value || discount.value <= 0) {
    return originalPrice
  }

  if (discount.type === 'percentage') {
    // 百分比折扣：如 20% 表示打 8 折（100% - 20% = 80%）
    const discountRate = (100 - discount.value) / 100
    return Math.round(originalPrice * discountRate)
  } else if (discount.type === 'fixed') {
    // 固定金额减免
    return Math.max(0, originalPrice - discount.value)
  }

  return originalPrice
}

/**
 * 从多个优惠中选择最优惠的方案
 * @param {number} originalPrice - 原始价格
 * @param {Array} discounts - 优惠列表
 * @returns {Object} 包含最优价格和最优优惠信息的对象
 */
const getBestDiscount = (originalPrice, discounts) => {
  if (!discounts || !Array.isArray(discounts) || discounts.length === 0) {
    return { finalPrice: originalPrice, bestDiscount: null }
  }

  let bestDiscount = null
  let lowestPrice = originalPrice

  for (const discount of discounts) {
    if (!discount || !discount.type || !discount.value || discount.value <= 0) {
      continue
    }

    const discountedPrice = calculateDiscountedPrice(originalPrice, discount)

    if (discountedPrice < lowestPrice) {
      lowestPrice = discountedPrice
      bestDiscount = discount
    }
  }

  return { finalPrice: lowestPrice, bestDiscount }
}

/**
 * 格式化酒店列表项
 * @param {Object} hotel - 酒店原始数据
 * @returns {Object} 格式化后的酒店数据
 */
const formatHotelListItem = (hotel, images = []) => {
  const roomTypes = safeParseJson(hotel.roomTypes)
  const minOriginalPrice = calculateMinPrice(roomTypes)
  const mainImage = images.length > 0 ? images[0] : ''

  // 解析优惠信息 - 自动选择最优惠的方案
  let discountInfo = null
  let finalPrice = minOriginalPrice
  let originalPrice = null
  const discounts = hotel.discounts || []
  const { finalPrice: bestPrice, bestDiscount } = getBestDiscount(minOriginalPrice, discounts)

  if (bestDiscount) {
    discountInfo = {
      type: bestDiscount.type || 'percentage',
      name: bestDiscount.name || '',
      value: bestDiscount.value || 0,
    }
    finalPrice = bestPrice
    originalPrice = minOriginalPrice
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
    price: finalPrice,
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
  const minOriginalPrice = calculateMinPrice(roomTypes)

  // 解析优惠信息 - 自动选择最优惠的方案
  let discountInfo = null
  let finalMinPrice = minOriginalPrice
  let originalMinPrice = null
  const discounts = hotel.discounts || []
  const { finalPrice: bestPrice, bestDiscount } = getBestDiscount(minOriginalPrice, discounts)

  if (bestDiscount) {
    discountInfo = {
      type: bestDiscount.type || 'percentage',
      name: bestDiscount.name || '',
      value: bestDiscount.value || 0,
      description: bestDiscount.description || '',
      startDate: bestDiscount.startDate || '',
      endDate: bestDiscount.endDate || '',
    }
    finalMinPrice = bestPrice
    originalMinPrice = minOriginalPrice
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

      // 计算折扣后的房型价格 - 使用最优优惠方案
      const originalRoomPrice = room.price || 0
      const { finalPrice: finalRoomPrice, bestDiscount: roomBestDiscount } = getBestDiscount(
        originalRoomPrice,
        discounts
      )
      const roomOriginalPrice = roomBestDiscount ? originalRoomPrice : null

      return {
        name: room.name || '',
        price: finalRoomPrice,
        originalPrice: roomOriginalPrice,
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
    price: finalMinPrice,
    originalPrice: originalMinPrice,
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

    // 提取关键词（支持多关键词搜索）
    const keywords = extractAddressKeywords(keyword.trim())

    // 构建搜索条件
    let where = {
      status: 'published',
    }

    if (keywords.length > 0) {
      // 多关键词搜索：任一关键词匹配酒店名称或地址即可
      where.OR = keywords.flatMap((kw) => [
        { nameZh: { contains: kw } },
        { nameEn: { contains: kw } },
        { address: { contains: kw } },
      ])
    } else {
      // 如果没有提取到关键词，使用原始关键字
      where.OR = [
        { nameZh: { contains: keyword.trim() } },
        { nameEn: { contains: keyword.trim() } },
        { address: { contains: keyword.trim() } },
      ]
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
      province,
      district,
      checkInDate,
      checkOutDate,
      starRating,
      minPrice,
      maxPrice,
      tags,
      facilities,
      roomTypes,
      sortBy = 'default',
      page = 1,
      limit = 10,
    } = req.query

    // 验证日期格式
    if (checkInDate && !isValidDate(checkInDate)) {
      return responseHandler.badRequest(res, '入住日期格式错误，请使用 YYYY-MM-DD 格式')
    }
    if (checkOutDate && !isValidDate(checkOutDate)) {
      return responseHandler.badRequest(res, '离店日期格式错误，请使用 YYYY-MM-DD 格式')
    }
    if (checkInDate && checkOutDate && new Date(checkInDate) >= new Date(checkOutDate)) {
      return responseHandler.badRequest(res, '离店日期必须晚于入住日期')
    }

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

    // 设施筛选（从所有房型中聚合设施）
    if (facilities) {
      const facilityList = facilities.split(',')
      list = list.filter((hotel) => {
        const hotelRoomTypes = safeParseJson(hotel.roomTypes)
        if (!Array.isArray(hotelRoomTypes)) return false
        // 聚合所有房型的设施
        const hotelFacilities = new Set()
        hotelRoomTypes.forEach((room) => {
          if (Array.isArray(room.facilities)) {
            room.facilities.forEach((f) => hotelFacilities.add(f))
          }
        })
        // 酒店必须包含所有筛选的设施
        return facilityList.every((f) => hotelFacilities.has(f.trim()))
      })
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

    // 位置筛选 - 省
    if (province) {
      list = list.filter((hotel) => {
        const location = extractLocationFromAddress(hotel.address)
        return location.province === province.trim()
      })
    }

    // 位置筛选 - 区/县
    if (district) {
      list = list.filter((hotel) => {
        const location = extractLocationFromAddress(hotel.address)
        return location.district === district.trim()
      })
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

    // 构建查询参数信息（用于前端展示）
    const queryInfo = {}
    if (checkInDate) queryInfo.checkInDate = checkInDate
    if (checkOutDate) queryInfo.checkOutDate = checkOutDate
    if (city) queryInfo.city = city

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
        queryInfo,
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
 * 从地址中提取位置信息（省、市、区）
 * @param {string} address - 酒店地址
 * @returns {Object} 位置信息对象
 */
const extractLocationFromAddress = (address) => {
  if (!address || typeof address !== 'string') return {}

  const location = {
    province: null,
    city: null,
    district: null,
  }

  // 提取省
  const provinceMatch = address.match(/^([^省市]+?省?)/)
  if (provinceMatch) {
    location.province = provinceMatch[1].replace(/省$/, '')
  }

  // 提取市
  const cityMatch = address.match(/([^省]+?市)/)
  if (cityMatch) {
    location.city = cityMatch[1].replace(/市$/, '')
  }

  // 提取区/县
  const districtMatch = address.match(/([^市区]+?[区县])/)
  if (districtMatch) {
    location.district = districtMatch[1].replace(/[区县]$/, '')
  }

  return location
}

/**
 * 获取筛选选项
 */
const getFilterOptions = async (req, res) => {
  try {
    // 从数据库获取已发布酒店的房型、地址等数据
    const hotels = await prisma.hotel.findMany({
      where: { status: 'published' },
      select: {
        address: true,
        roomTypes: true,
      },
    })

    // 提取所有设施（从房型中聚合）
    const facilitiesSet = new Set()
    // 提取所有房型名称（去重）
    const roomTypesSet = new Set()
    // 提取所有位置信息
    const provincesSet = new Set()
    const citiesSet = new Set()
    const districtsSet = new Set()

    hotels.forEach((hotel) => {
      // 提取位置信息
      const location = extractLocationFromAddress(hotel.address)
      if (location.province) provincesSet.add(location.province)
      if (location.city) citiesSet.add(location.city)
      if (location.district) districtsSet.add(location.district)

      // 提取房型和设施
      const roomTypes = safeParseJson(hotel.roomTypes)
      if (Array.isArray(roomTypes)) {
        roomTypes.forEach((room) => {
          // 提取房型名称
          if (room.name) roomTypesSet.add(room.name)
          // 提取设施（从每个房型的facilities字段）
          if (Array.isArray(room.facilities)) {
            room.facilities.forEach((f) => facilitiesSet.add(f))
          }
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
      // 位置筛选（从数据库动态获取）
      locations: {
        provinces: Array.from(provincesSet).map((p) => ({ value: p, label: p })),
        cities: Array.from(citiesSet).map((c) => ({ value: c, label: c })),
        districts: Array.from(districtsSet).map((d) => ({ value: d, label: d })),
      },
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
