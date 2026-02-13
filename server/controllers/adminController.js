const { PrismaClient } = require('@prisma/client')
const responseHandler = require('../utils/response')
const { ResponseCode, ResponseMessage } = require('../constants/response')

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
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.hotel.count({ where }),
    ])

    const hotelsWithImage = hotels.map((hotel) => ({
      ...hotel,
      image: hotel.images && hotel.images.length > 0 ? hotel.images[0] : null,
    }))

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
        creator: {
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

    return responseHandler.success(res, hotel, ResponseMessage.HOTEL_QUERY_SUCCESS)
  } catch (error) {
    console.error('Get admin hotel error:', error)
    return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
  }
}

const approveHotel = async (req, res) => {
  try {
    const { id } = req.params

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id) },
    })

    if (!hotel) {
      return responseHandler.notFound(res, ResponseMessage.HOTEL_NOT_FOUND)
    }

    if (hotel.status !== 'pending') {
      return responseHandler.badRequest(res, ResponseMessage.APPROVE_PENDING_ONLY)
    }

    let updateData = {
      status: 'approved',
      rejectReason: null,
    }

    if (hotel.draftData) {
      updateData = {
        ...updateData,
        ...hotel.draftData,
        draftData: null,
      }
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_APPROVE_SUCCESS)
  } catch (error) {
    console.error('Approve hotel error:', error)
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
      },
    })

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

    const updatedHotel = await prisma.hotel.update({
      where: { id: parseInt(id) },
      data: {
        status: 'offline',
      },
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
      },
    })

    return responseHandler.success(res, updatedHotel, ResponseMessage.HOTEL_RESTORE_SUCCESS)
  } catch (error) {
    console.error('Restore hotel error:', error)
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
}
