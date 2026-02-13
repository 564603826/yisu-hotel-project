# 技术文档

## 项目概述

易宿酒店预订平台 PC 端后端服务，提供用户认证、酒店信息管理和审核发布功能。

### 技术栈

| 技术     | 版本  | 说明       |
| -------- | ----- | ---------- |
| Node.js  | 18+   | 运行时环境 |
| Express  | 5.x   | Web 框架   |
| Prisma   | 6.5.0 | ORM 框架   |
| MySQL    | 8.x   | 数据库     |
| JWT      | -     | 身份认证   |
| bcryptjs | -     | 密码加密   |
| multer   | -     | 文件上传   |

## 项目结构

```
server/
├── app.js                 # 应用入口
├── package.json           # 项目配置
├── .env                  # 环境变量
├── prisma/               # Prisma 配置
│   └── schema.prisma      # 数据模型定义
├── controllers/          # 控制器层
│   ├── userController.js  # 用户认证
│   ├── hotelController.js # 酒店管理（商户端）
│   ├── adminController.js # 审核管理（管理员端）
│   └── uploadController.js # 文件上传
├── middleware/           # 中间件
│   └── auth.js           # JWT 认证中间件
├── routes/               # 路由层
│   ├── auth.js           # 认证路由
│   ├── hotel.js          # 酒店路由（商户端）
│   ├── admin.js          # 管理员路由
│   └── upload.js         # 上传路由
├── utils/                # 工具函数
│   ├── jwt.js            # JWT 工具
│   ├── response.js       # 响应工具
│   └── upload.js         # 上传工具
├── constants/            # 常量定义
│   └── response.js       # 响应码和消息
├── uploads/              # 上传文件目录
├── types.ts              # TypeScript 类型定义
└── docs/                 # 文档
    ├── API.md
    ├── API_DESIGN.md
    ├── DATABASE_DESIGN.md
    ├── TECHNICAL.md
    └── VALIDATION.md
```

## 核心模块说明

### 1. 应用入口 (app.js)

Express 应用的主入口文件，负责：

- 加载环境变量
- 配置中间件（CORS、JSON 解析、静态文件）
- 注册路由（带 /api/v1 前缀）
- 错误处理
- 优雅关闭

**关键代码**:

```javascript
const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/hotels', hotelRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/upload', uploadRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
```

### 2. 控制器层 (controllers/)

处理业务逻辑，负责参数校验、业务处理、数据库操作、响应返回。

#### userController.js - 用户认证

| 函数         | 说明                                    |
| ------------ | --------------------------------------- |
| registerUser | 用户注册（用户名/密码验证、bcrypt加密） |
| loginUser    | 用户登录（验证、生成JWT）               |

#### hotelController.js - 酒店管理（商户端）

| 函数                | 说明                         |
| ------------------- | ---------------------------- |
| getMyHotel          | 获取/初始化商户酒店          |
| updateMyHotel       | 更新酒店信息（支持版本控制） |
| submitMyHotel       | 提交审核                     |
| cancelSubmitMyHotel | 取消提交                     |

**版本控制核心逻辑**:

```javascript
const isOnlineStatus = (status) => {
  return status === 'published' || status === 'offline'
}

if (isOnlineStatus(hotel.status)) {
  // 已上线酒店：新数据存入 draftData，主数据不变
  updatedHotel = await prisma.hotel.update({
    where: { creatorId: userId },
    data: { draftData: newDraftData },
  })
} else {
  // 草稿/审核不通过：直接更新主数据
  updatedHotel = await prisma.hotel.update({
    where: { creatorId: userId },
    data: { ...updateData, status: 'draft' },
  })
}
```

#### adminController.js - 审核管理（管理员端）

| 函数              | 说明                       |
| ----------------- | -------------------------- |
| getAdminHotels    | 获取酒店列表（分页、筛选） |
| getAdminHotelById | 获取酒店详情               |
| approveHotel      | 审核通过（合并draftData）  |
| rejectHotel       | 审核不通过                 |
| publishHotel      | 发布酒店                   |
| offlineHotel      | 下线酒店                   |
| restoreHotel      | 恢复上线                   |

**审核通过核心逻辑**:

```javascript
if (hotel.draftData) {
  // 有草稿数据：合并到主数据
  updateData = {
    ...updateData,
    ...hotel.draftData,
    draftData: null,
  }
}
```

#### uploadController.js - 文件上传

| 函数                 | 说明                     |
| -------------------- | ------------------------ |
| uploadImage          | 单图上传                 |
| uploadMultipleImages | 多图上传                 |
| checkHotelStatus     | 检查酒店状态（权限控制） |

### 3. 中间件层 (middleware/)

#### auth.js - JWT 认证

```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) {
    return responseHandler.unauthorized(res, ResponseMessage.TOKEN_MISSING)
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return responseHandler.unauthorized(res, ResponseMessage.TOKEN_INVALID)
  }

  req.user = decoded
  next()
}
```

**权限控制**:

```javascript
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return responseHandler.forbidden(res, ResponseMessage.FORBIDDEN)
    }
    next()
  }
}
```

### 4. 路由层 (routes/)

| 路由文件  | 路径前缀       | 权限           |
| --------- | -------------- | -------------- |
| auth.js   | /api/v1/auth   | 公开           |
| hotel.js  | /api/v1/hotels | merchant       |
| admin.js  | /api/v1/admin  | admin          |
| upload.js | /api/v1/upload | merchant/admin |

### 5. 工具层 (utils/)

#### jwt.js

- `generateToken`: 生成 JWT 令牌（24小时有效）
- `verifyToken`: 验证 JWT 令牌

#### response.js

统一响应格式处理：

```javascript
module.exports = {
  success: (res, data, msg, code) => {...},
  error: (res, msg, code, data) => {...},
  badRequest: (res, msg, code, data) => {...},
  unauthorized: (res, msg) => {...},
  forbidden: (res, msg) => {...},
  notFound: (res, msg) => {...},
  conflict: (res, msg) => {...},
};
```

#### upload.js

- `upload`: multer 配置（文件类型、大小限制）
- `getImageUrl`: 获取图片访问URL

### 6. 常量层 (constants/)

#### response.js

```javascript
const ResponseCode = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  // 业务错误码
  USER_NOT_FOUND: 1001,
  INVALID_PASSWORD: 1002,
  USER_ALREADY_EXISTS: 1003,
  HOTEL_NOT_FOUND: 2001,
  HOTEL_INFO_INCOMPLETE: 2011,
  // ...
}

const ResponseMessage = {
  SUCCESS: '操作成功',
  LOGIN_SUCCESS: '登录成功',
  REGISTER_SUCCESS: '注册成功',
  // ...
}
```

## 环境变量

```env
# 数据库连接
DATABASE_URL="mysql://root:@localhost:3306/yisu-hotel-db"

# JWT 密钥
JWT_SECRET="your-secret-key-here"

# 服务器端口
PORT=3000
```

| 变量名       | 必填 | 默认值              | 说明                   |
| ------------ | ---- | ------------------- | ---------------------- |
| DATABASE_URL | 是   | -                   | MySQL 数据库连接字符串 |
| JWT_SECRET   | 否   | fallback_secret_key | JWT 签名密钥           |
| PORT         | 否   | 3000                | 服务器监听端口         |

## 版本控制机制

### 核心原理

已发布/已下线的酒店，在审核期间保持原版本数据，客户端仍可正常访问。新修改的数据存储在 `draftData` 字段中，审核通过后才合并到主数据。

### 数据存储规则

| 酒店状态          | 修改操作 | 数据存储位置   |
| ----------------- | -------- | -------------- |
| draft/rejected    | 直接更新 | 主数据字段     |
| published/offline | 更新草稿 | draftData 字段 |

### 状态流转

```
published/offline
    │
    ├── 编辑 ──> 数据存入 draftData，主数据不变
    │
    ├── 提交审核 ──> 状态变为 pending
    │                  │
    │                  ├── 审核通过 ──> draftData 合并到主数据
    │                  │
    │                  └── 审核不通过 ──> draftData 保留
    │
    └── 取消提交 ──> 恢复为 published（如有 draftData）
```

### 关键代码实现

**更新酒店（版本控制）**:

```javascript
if (isOnlineStatus(hotel.status)) {
  const currentData = {
    /* 当前主数据 */
  }
  const newDraftData = { ...currentData, ...updateData }

  await prisma.hotel.update({
    where: { creatorId: userId },
    data: { draftData: newDraftData },
  })
}
```

**审核通过（合并数据）**:

```javascript
if (hotel.draftData) {
  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      ...hotel.draftData,
      draftData: null,
      status: 'approved',
    },
  })
}
```

## 认证机制

### JWT 令牌结构

```json
{
  "userId": 1,
  "username": "merchant1",
  "role": "merchant",
  "iat": 1770784401,
  "exp": 1770870801
}
```

### 密码加密

```javascript
const bcrypt = require('bcryptjs')

// 加密（salt rounds = 10）
const hashedPassword = await bcrypt.hash(password, 10)

// 验证
const isValid = await bcrypt.compare(password, hashedPassword)
```

## 统一响应格式

所有接口返回统一格式：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

## 文件上传

### 配置

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'hotel-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    // ...
  },
})
```

### 访问上传文件

```
http://localhost:3000/uploads/hotel-xxx.jpg
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动生产服务器
npm start

# 生成 Prisma Client
npm run prisma:generate

# 同步数据库
npm run prisma:migrate

# 打开 Prisma Studio
npm run prisma:studio
```

## 部署建议

### 生产环境配置

1. 使用强密码的 `JWT_SECRET`
2. 配置 CORS 白名单
3. 启用 HTTPS
4. 配置日志系统
5. 设置速率限制
6. 配置数据库连接池

### 安全最佳实践

1. **密码安全**: bcrypt 加密，salt rounds = 10
2. **令牌安全**: JWT 有效期 24 小时
3. **输入验证**: 所有输入参数校验
4. **SQL 注入防护**: Prisma ORM 自动防护
5. **文件上传**: 类型限制、大小限制
6. **权限控制**: 基于角色的访问控制

## 性能优化

1. **数据库索引**: status、starRating 字段已建索引
2. **连接池**: Prisma 默认配置
3. **静态资源**: 可迁移至 CDN
4. **缓存**: 可使用 Redis 缓存热点数据

## 扩展建议

1. **日志系统**: 集成 Winston 或 Pino
2. **API 文档**: 集成 Swagger
3. **测试**: 添加单元测试和集成测试
4. **监控**: 集成 APM 工具
5. **消息队列**: 审核通知可使用消息队列
