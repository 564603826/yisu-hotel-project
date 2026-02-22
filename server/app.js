require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const responseHandler = require('./utils/response')
const { ResponseMessage } = require('./constants/response')

const authRoutes = require('./routes/auth')
const hotelRoutes = require('./routes/hotel')
const adminRoutes = require('./routes/admin')
const uploadRoutes = require('./routes/upload')
const mobileRoutes = require('./routes/mobile')

const app = express()
const prisma = new PrismaClient()

// CORS 配置 - 允许前端域名访问
// 临时允许所有来源测试
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
)

// 生产环境应该使用下面的配置：
// const corsOptions = {
//   origin: [
//     'http://localhost:5173',
//     'https://yisu-hotel-project.vercel.app',
//     'https://yisu-hotel-pc.vercel.app',
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
// }
// app.use(cors(corsOptions))

app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/hotels', hotelRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/mobile', mobileRoutes)

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return responseHandler.badRequest(res, '文件大小不能超过5MB')
  }
  if (err.message && err.message.includes('只支持图片文件')) {
    return responseHandler.badRequest(res, err.message)
  }
  return responseHandler.error(res, ResponseMessage.INTERNAL_ERROR)
})

app.use((req, res) => {
  return responseHandler.notFound(res, ResponseMessage.NOT_FOUND)
})

const PORT = process.env.PORT || 3000

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = { app, prisma }
