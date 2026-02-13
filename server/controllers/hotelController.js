const { PrismaClient } = require('@prisma/client')
const responseHandler = require('../utils/response')
const { ResponseCode, ResponseMessage } = require('../constants/response')

const prisma = new PrismaClient()

const validateHotelInfo = (hotel) => {
  const errors = []

  if (!hotel.nameZh || !hotel.nameZh.trim()) {
    errors.push('酒店中文名')
  }
  if (!hotel.nameEn || !hotel.nameEn.trim()) {
    errors.push('酒店英文名')
  }
  if (!hotel.address || !hotel.address.trim()) {
    errors.push('酒店地址')
  }
  if (!hotel.starRating || hotel.starRating < 1 || hotel.starRating > 5) {
    errors.push('酒店星级(1-5)')
  }
  if (!hotel.roomTypes || !Array.isArray(hotel.roomTypes) || hotel.roomTypes.length === 0) {
    errors.push('房型信息(至少一个房型)')
  } else {
    const invalidRooms = hotel.roomTypes.filter((room) => !room.price || room.price <= 0)
    if (invalidRooms.length > 0) {
      errors.push('房型价格(每个房型必须有有效价格)')
    }
  }
  if (!hotel.openDate) {
    errors.push('开业时间')
  }

  if (errors.length > 0) {
    return { valid: false, missingFields: errors }
  }
  return { valid: true, missingFields: [] }
}

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

const calculateMinPrice = (roomTypes) => {
  if (!roomTypes || !Array.isArray(roomTypes) || roomTypes.length === 0) {
    return 0
  }
  const prices = roomTypes.map((room) => room.price).filter((price) => price && price > 0)
  return prices.length > 0 ? Math.min(...prices) : 0
}

const isOnlineStatus = (status) => {
  return status === 'published' || status === 'offline'
}

const getMyHotel = async (req, res) => {
  try {
    const userId = req.user.userId

    let hotel = await prisma.hotel.findUnique({
      where: { creatorId: userId },
    })

    if (!hotel) {
      hotel = await prisma.hotel.create({
        data: {
          nameZh: '',
          nameEn: '',
          address: '',
          starRating: 0,
          roomTypes: [],
          price: 0,
          openDate: new Date(),
          creatorId: userId,
        },
      })
    }

    return responseHandler.success(res, hotel, ResponseMessage.HOTEL_QUERY_SUCCESS)
  } catch (error) {
    console.error('Get my hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const updateMyHotel = async (req, res) => {
  try {
    const userId = req.user.userId
    const updateData = req.body

    const hotel = await prisma.hotel.findUnique({
      where: { creatorId: userId },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    const allowedStatuses = ['draft', 'rejected', 'published', 'offline']
    if (!allowedStatuses.includes(hotel.status)) {
      return responseHandler.badRequest(
        res,
        `当前酒店状态为「${getStatusMessage(hotel.status)}」，只能修改草稿、审核不通过、已发布或已下线状态的酒店`
      )
    }

    if (updateData.starRating !== undefined) {
      if (updateData.starRating < 1 || updateData.starRating > 5) {
        return responseHandler.badRequest(res, '酒店星级必须在1-5之间')
      }
    }

    if (updateData.openDate) {
      updateData.openDate = new Date(updateData.openDate)
    }

    if (updateData.roomTypes && Array.isArray(updateData.roomTypes)) {
      updateData.price = calculateMinPrice(updateData.roomTypes)
    }

    let updatedHotel

    if (isOnlineStatus(hotel.status)) {
      const currentData = {
        nameZh: hotel.nameZh,
        nameEn: hotel.nameEn,
        address: hotel.address,
        starRating: hotel.starRating,
        roomTypes: hotel.roomTypes,
        price: hotel.price,
        openDate: hotel.openDate,
        nearbyAttractions: hotel.nearbyAttractions,
        nearbyTransport: hotel.nearbyTransport,
        nearbyMalls: hotel.nearbyMalls,
        discounts: hotel.discounts,
        images: hotel.images,
        description: hotel.description,
      }

      const newDraftData = {
        ...currentData,
        ...updateData,
      }

      updatedHotel = await prisma.hotel.update({
        where: { creatorId: userId },
        data: {
          draftData: newDraftData,
        },
      })
    } else {
      updatedHotel = await prisma.hotel.update({
        where: { creatorId: userId },
        data: {
          ...updateData,
          status: 'draft',
        },
      })
    }

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_UPDATE_SUCCESS)
  } catch (error) {
    console.error('Update my hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const submitMyHotel = async (req, res) => {
  try {
    const userId = req.user.userId

    const hotel = await prisma.hotel.findUnique({
      where: { creatorId: userId },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    const allowedStatuses = ['draft', 'rejected', 'published', 'offline']
    if (!allowedStatuses.includes(hotel.status)) {
      return responseHandler.badRequest(
        res,
        `当前酒店状态为「${getStatusMessage(hotel.status)}」，只能提交草稿、审核不通过、已发布或已下线状态的酒店`
      )
    }

    let dataToValidate
    if (isOnlineStatus(hotel.status) && hotel.draftData) {
      dataToValidate = hotel.draftData
    } else if (isOnlineStatus(hotel.status) && !hotel.draftData) {
      return responseHandler.badRequest(res, '请先修改酒店信息后再提交审核')
    } else {
      dataToValidate = {
        nameZh: hotel.nameZh,
        nameEn: hotel.nameEn,
        address: hotel.address,
        starRating: hotel.starRating,
        roomTypes: hotel.roomTypes,
        price: hotel.price,
        openDate: hotel.openDate,
      }
    }

    const validation = validateHotelInfo(dataToValidate)
    if (!validation.valid) {
      return responseHandler.badRequest(
        res,
        `请完善以下必填信息：${validation.missingFields.join('、')}`,
        ResponseCode.HOTEL_INFO_INCOMPLETE
      )
    }

    const updatedHotel = await prisma.hotel.update({
      where: { creatorId: userId },
      data: {
        status: 'pending',
      },
    })

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_SUBMIT_SUCCESS)
  } catch (error) {
    console.error('Submit my hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const cancelSubmitMyHotel = async (req, res) => {
  try {
    const userId = req.user.userId

    const hotel = await prisma.hotel.findUnique({
      where: { creatorId: userId },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (hotel.status !== 'pending') {
      return responseHandler.badRequest(
        res,
        `当前酒店状态为「${getStatusMessage(hotel.status)}」，只能取消审核中状态的酒店`
      )
    }

    let updateData
    if (hotel.draftData) {
      updateData = {
        status: 'published',
      }
    } else {
      updateData = {
        status: 'draft',
      }
    }

    const updatedHotel = await prisma.hotel.update({
      where: { creatorId: userId },
      data: updateData,
    })

    return responseHandler.success(res, updatedHotel, '取消提交成功')
  } catch (error) {
    console.error('Cancel submit my hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

module.exports = {
  getMyHotel,
  updateMyHotel,
  submitMyHotel,
  cancelSubmitMyHotel,
}
