const { PrismaClient } = require('@prisma/client')
const responseHandler = require('../utils/response')
const { ResponseCode, ResponseMessage } = require('../constants/response')
const { getImagesForHotel } = require('./uploadController')

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

// 比较两个对象是否相等（深度比较）
const isEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

// 检查酒店数据是否有变化
const hasDataChanged = (currentData, newData) => {
  const fieldsToCompare = [
    'nameZh',
    'nameEn',
    'address',
    'starRating',
    'roomTypes',
    'openDate',
    'nearbyAttractions',
    'nearbyTransport',
    'nearbyMalls',
    'facilities',
    'discounts',
    'description',
    'images',
  ]

  for (const field of fieldsToCompare) {
    if (newData[field] === undefined) continue

    const currentValue = currentData[field]
    const newValue = newData[field]

    // 处理日期比较
    if (field === 'openDate') {
      const currentDate =
        currentValue instanceof Date ? currentValue.toISOString().split('T')[0] : currentValue
      const newDate = newValue instanceof Date ? newValue.toISOString().split('T')[0] : newValue
      if (currentDate !== newDate) return true
      continue
    }

    // 处理数组和对象比较
    if (Array.isArray(currentValue) || typeof currentValue === 'object') {
      if (!isEqual(currentValue, newValue)) return true
    } else {
      if (currentValue !== newValue) return true
    }
  }

  return false
}

const getMyHotel = async (req, res) => {
  try {
    const userId = req.user.userId
    // 获取查看模式参数：'draft' 表示编辑草稿，'published' 表示查看线上版本
    const viewMode = req.query.viewMode || 'draft'

    let hotel = await prisma.hotel.findUnique({
      where: { creatorId: userId },
    })

    if (!hotel) {
      const now = new Date()
      hotel = await prisma.hotel.create({
        data: {
          nameZh: '',
          nameEn: '',
          address: '',
          starRating: 0,
          roomTypes: [],
          price: 0,
          openDate: now,
          updatedAt: now,
          creatorId: userId,
        },
      })
    }

    // 根据查看模式获取酒店图片
    // pending（待审核）、rejected（已驳回）和 draft（草稿）状态显示草稿图片（包括空数组的情况）
    // 其他状态显示已发布图片
    const isDraftVersion =
      hotel.status === 'pending' || hotel.status === 'rejected' || hotel.status === 'draft'
    const hotelImages = await getImagesForHotel(
      hotel.id,
      viewMode === 'published' ? 'published' : isDraftVersion ? 'draft' : 'published'
    )

    // 获取房型数据
    let roomTypesWithImages
    if (viewMode === 'published') {
      // 查看线上版本：使用已发布房型数据
      roomTypesWithImages = hotel.roomTypes || []
    } else {
      // 编辑草稿模式：优先使用 draftData 中的房型数据（如果 draftData 存在）
      // 如果 draftData 存在，使用 draftData 中的房型数据（即使是空数组也使用，表示用户删除了所有房型）
      const hasDraftData = hotel.draftData !== undefined && hotel.draftData !== null
      roomTypesWithImages = hasDraftData ? hotel.draftData?.roomTypes || [] : hotel.roomTypes || []
    }

    if (roomTypesWithImages.length > 0) {
      // 获取房型图片
      let roomImages
      if (viewMode === 'published') {
        // 查看线上版本：只获取已发布房型图片
        roomImages = await prisma.hotelimage.findMany({
          where: {
            hotelId: hotel.id,
            type: 'hotel_room',
            status: 'published',
          },
          orderBy: { sortOrder: 'asc' },
        })
      } else {
        // 编辑草稿模式：优先获取草稿房型图片
        roomImages = await prisma.hotelimage.findMany({
          where: {
            hotelId: hotel.id,
            type: 'hotel_room',
            status: 'draft',
          },
          orderBy: { sortOrder: 'asc' },
        })
        // 如果没有草稿图片，则获取已发布图片
        if (roomImages.length === 0) {
          roomImages = await prisma.hotelimage.findMany({
            where: {
              hotelId: hotel.id,
              type: 'hotel_room',
              status: 'published',
            },
            orderBy: { sortOrder: 'asc' },
          })
        }
      }

      // 按房型分组图片
      roomTypesWithImages = roomTypesWithImages.map((room) => {
        const imageUrls = roomImages
          .filter((img) => img.roomType === room.name)
          .map((img) => img.url)

        // 合并图片：优先使用数据库中存储的 images，然后补充图片表中的图片
        // 这样可以避免房型名称不匹配导致图片丢失的问题
        const storedImages = room.images || []
        const finalImages = storedImages.length > 0 ? storedImages : imageUrls

        return {
          ...room,
          images: finalImages,
        }
      })
    }

    // 构造返回数据，避免 draftData 中的数据污染外层
    const { draftData, ...hotelWithoutDraft } = hotel

    // 对于草稿版本，优先使用 draftData 中的 discounts 数据
    const hasDraftData = draftData !== undefined && draftData !== null
    const finalDiscounts =
      isDraftVersion && hasDraftData && draftData.discounts !== undefined
        ? draftData.discounts
        : hotel.discounts

    // 对于 pending 和 rejected 状态，优先使用 draftData 中的基础信息字段
    const draftBaseData =
      isDraftVersion && hasDraftData && viewMode !== 'published'
        ? {
            nameZh: draftData.nameZh,
            nameEn: draftData.nameEn,
            address: draftData.address,
            starRating: draftData.starRating,
            price: draftData.price,
            openDate: draftData.openDate,
            description: draftData.description,
            facilities: draftData.facilities,
            nearbyAttractions: draftData.nearbyAttractions,
            nearbyTransport: draftData.nearbyTransport,
            nearbyMalls: draftData.nearbyMalls,
          }
        : {}

    const hotelWithImages = {
      ...hotelWithoutDraft,
      ...draftBaseData,
      images: hotelImages,
      roomTypes: roomTypesWithImages,
      discounts: finalDiscounts,
      // 只在编辑模式下返回 draftData
      draftData: viewMode === 'published' ? undefined : draftData,
    }

    return responseHandler.success(res, hotelWithImages, ResponseMessage.HOTEL_QUERY_SUCCESS)
  } catch (error) {
    console.error('Get my hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const updateMyHotel = async (req, res) => {
  try {
    const userId = req.user.userId
    const updateData = req.body

    // 删除 images 字段，因为图片存储在 hotelimage 表中，不在 hotel 表中
    if (updateData.images !== undefined) {
      delete updateData.images
    }

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

    // 验证星级：如果提供了星级且不为0，则必须在1-5之间
    if (
      updateData.starRating !== undefined &&
      updateData.starRating !== 0 &&
      updateData.starRating !== null
    ) {
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

    if (isOnlineStatus(hotel.status) || hotel.status === 'rejected') {
      // published/offline/rejected 状态：数据保存到 draftData，不修改主表数据
      // 获取最新的草稿图片
      const draftImages = await prisma.hotelimage.findMany({
        where: {
          hotelId: hotel.id,
          type: 'hotel_main',
          status: 'draft',
        },
        orderBy: { sortOrder: 'asc' },
      })

      // 对于 rejected 状态，从主表获取当前数据作为基础
      // 对于 published/offline 状态，优先使用已有的 draftData
      const baseData =
        hotel.status === 'rejected'
          ? {
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
              facilities: hotel.facilities,
              discounts: hotel.discounts,
              description: hotel.description,
              images: draftImages.map((img) => img.url),
            }
          : {
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
              facilities: hotel.facilities,
              discounts: hotel.discounts,
              description: hotel.description,
              // 如果没有草稿图片但有已发布图片，使用已发布图片
              images:
                draftImages.length > 0 ? draftImages.map((img) => img.url) : hotel.images || [],
              ...hotel.draftData,
            }

      const newDraftData = {
        ...baseData,
        ...updateData,
      }

      updatedHotel = await prisma.hotel.update({
        where: { creatorId: userId },
        data: {
          draftData: newDraftData,
          // rejected 状态保持 rejected，published/offline 保持原状态
          status: hotel.status,
          updatedAt: new Date(),
        },
      })
    } else {
      // draft 状态直接更新主表数据
      updatedHotel = await prisma.hotel.update({
        where: { creatorId: userId },
        data: {
          ...updateData,
          status: 'draft',
          updatedAt: new Date(),
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
    const { auditInfo } = req.body

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

    // 构建完整的酒店数据用于验证和保存
    let dataToValidate
    if (isOnlineStatus(hotel.status) && hotel.draftData) {
      // published/offline 状态且有 draftData，使用 draftData
      dataToValidate = hotel.draftData
    } else if (isOnlineStatus(hotel.status) && !hotel.draftData) {
      return responseHandler.badRequest(res, '请先修改酒店信息后再提交审核')
    } else if (hotel.status === 'rejected' && hotel.draftData) {
      // rejected 状态且有 draftData，使用 draftData（被驳回后修改的数据）
      dataToValidate = hotel.draftData
    } else {
      // draft 状态或 rejected 状态但没有 draftData，从主表字段构建完整数据
      dataToValidate = {
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
        facilities: hotel.facilities,
        discounts: hotel.discounts,
        description: hotel.description,
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

    // 对于 rejected 状态，需要将数据保存到 draftData，这样管理员才能看到完整数据
    const updateData = {
      status: 'pending',
      auditInfo: auditInfo || null,
      updatedAt: new Date(),
    }

    // 如果是 rejected 状态提交，把当前数据保存到 draftData
    if (hotel.status === 'rejected') {
      updateData.draftData = dataToValidate
    }

    const updatedHotel = await prisma.hotel.update({
      where: { creatorId: userId },
      data: updateData,
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

    // 判断撤销后应该回到什么状态：
    // 1. 如果有 rejectReason，说明之前是被驳回后重新提交的，撤销后回到 rejected 状态
    // 2. 如果没有 rejectReason，说明是从 published 直接提交的，撤销后回到 published
    // 3. 如果没有 draftData，说明是 draft 状态提交的，撤销后回到 draft
    let updateData
    if (hotel.rejectReason) {
      // 有被驳回记录，回到 rejected 状态
      updateData = {
        status: 'rejected',
      }
    } else if (hotel.draftData) {
      // 有草稿数据但没有驳回记录，说明是从 published 提交的
      updateData = {
        status: 'published',
      }
    } else {
      // 没有草稿数据，说明是从 draft 提交的
      updateData = {
        status: 'draft',
      }
    }

    const updatedHotel = await prisma.hotel.update({
      where: { creatorId: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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
