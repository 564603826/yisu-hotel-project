const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = path.join(__dirname, '../uploads')

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 创建子目录
const createSubDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// 根据参数构建存储路径
// type: 'hotel_main' | 'hotel_room' | 'hotel_banner' | 'user_avatar'
// hotelId: 酒店ID
// roomType: 房型名称（可选，仅当 type 为 'hotel_room' 时使用）
const getUploadPath = (type, hotelId, roomType = null) => {
  const timestamp = Date.now()
  const random = Math.round(Math.random() * 1e9).toString(36)
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // 确保 hotelId 有值
  const safeHotelId = hotelId || '0'

  let subPath = ''
  let filename = ''

  switch (type) {
    case 'hotel_main':
      // uploads/hotels/{hotelId}/main/{date}/{timestamp}_{random}.ext
      subPath = path.join('hotels', safeHotelId.toString(), 'main', date)
      filename = `${timestamp}_${random}`
      break
    case 'hotel_room':
      // uploads/hotels/{hotelId}/rooms/{roomType}/{date}/{timestamp}_{random}.ext
      const sanitizedRoomType = roomType
        ? roomType.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
        : 'default'
      subPath = path.join('hotels', safeHotelId.toString(), 'rooms', sanitizedRoomType, date)
      filename = `${timestamp}_${random}`
      break
    case 'hotel_banner':
      // uploads/banners/{hotelId}/{date}/{timestamp}_{random}.ext
      subPath = path.join('banners', safeHotelId.toString(), date)
      filename = `${timestamp}_${random}`
      break
    case 'user_avatar':
      // uploads/avatars/{userId}/{date}/{timestamp}_{random}.ext
      subPath = path.join('avatars', safeHotelId.toString(), date)
      filename = `${timestamp}_${random}`
      break
    default:
      // 默认：uploads/temp/{date}/{timestamp}_{random}.ext
      subPath = path.join('temp', date)
      filename = `${timestamp}_${random}`
  }

  const fullPath = path.join(uploadDir, subPath)
  createSubDir(fullPath)

  return {
    subPath,
    fullPath,
    filename,
  }
}

// 动态存储配置
const createStorage = (options = {}) => {
  const { type = 'temp', hotelId = '0', roomType = null } = options

  return multer.diskStorage({
    destination: (req, file, cb) => {
      const { fullPath } = getUploadPath(type, hotelId, roomType)
      cb(null, fullPath)
    },
    filename: (req, file, cb) => {
      const { filename } = getUploadPath(type, hotelId, roomType)
      const ext = path.extname(file.originalname)
      cb(null, `${filename}${ext}`)
    },
  })
}

// 默认存储（向后兼容）
const defaultStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `hotel-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'))
  }
}

// 默认上传配置（向后兼容）
const upload = multer({
  storage: defaultStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// 创建带路径分类的上传中间件
const createUploadMiddleware = (options = {}) => {
  const storage = createStorage(options)
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  })
}

// 获取图片URL（支持新的路径结构）
const getImageUrl = (filename, subPath = '') => {
  if (subPath) {
    return `/uploads/${subPath}/${filename}`
  }
  return `/uploads/${filename}`
}

// 从URL解析文件路径
const parseImagePath = (url) => {
  if (!url || !url.startsWith('/uploads/')) {
    return null
  }
  const relativePath = url.replace('/uploads/', '')
  return {
    relativePath,
    fullPath: path.join(uploadDir, relativePath),
  }
}

// 删除图片文件
const deleteImageFile = (url) => {
  try {
    const parsed = parseImagePath(url)
    if (parsed && fs.existsSync(parsed.fullPath)) {
      fs.unlinkSync(parsed.fullPath)
      return true
    }
  } catch (error) {
    console.error('删除图片失败:', error)
  }
  return false
}

module.exports = {
  upload,
  createUploadMiddleware,
  getImageUrl,
  getUploadPath,
  parseImagePath,
  deleteImageFile,
  uploadDir,
  fileFilter,
}
