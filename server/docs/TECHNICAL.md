# 易宿酒店预订平台 - 后端技术文档

## 项目概述

易宿酒店预订平台后端服务，为 PC 端管理后台和移动端 C 端应用提供统一的 API 服务。支持用户认证、酒店管理、审核发布、Banner 运营、移动端搜索等核心功能。

### 服务端口

| 端口号 | 服务             | 说明            |
| ------ | ---------------- | --------------- |
| 3000   | 后端 API 服务    | 主服务端口      |
| 5173   | PC 端开发服务器  | Vite 开发服务器 |
| 5174   | 移动端开发服务器 | Vite 开发服务器 |

---

## 技术栈

| 技术     | 版本  | 说明       |
| -------- | ----- | ---------- |
| Node.js  | 18+   | 运行时环境 |
| Express  | 5.x   | Web 框架   |
| Prisma   | 6.5.0 | ORM 框架   |
| MySQL    | 8.x   | 数据库     |
| JWT      | -     | 身份认证   |
| bcryptjs | -     | 密码加密   |
| multer   | -     | 文件上传   |

---

## 项目结构

```
server/
├── app.js                 # 应用入口
├── package.json           # 项目配置
├── .env                  # 环境变量
├── prisma/
│   └── schema.prisma      # 数据模型定义
├── controllers/          # 控制器层
│   ├── userController.js      # 用户认证
│   ├── hotelController.js     # 酒店管理（商户端 PC）
│   ├── adminController.js     # 审核管理（管理员 PC）
│   ├── mobileController.js    # 移动端 API（C 端）
│   ├── bannerController.js    # Banner 管理
│   └── uploadController.js    # 文件上传
├── middleware/
│   └── auth.js           # JWT 认证中间件
├── routes/               # 路由层
│   ├── auth.js           # 认证路由
│   ├── hotel.js          # 商户端路由（PC）
│   ├── admin.js          # 管理员路由（PC）
│   ├── mobile.js         # 移动端路由（C 端）
│   └── upload.js         # 上传路由
├── utils/                # 工具函数
│   ├── jwt.js            # JWT 工具
│   ├── response.js       # 响应工具
│   └── upload.js         # 上传工具
├── constants/            # 常量定义
│   └── response.js       # 响应码和消息
├── uploads/              # 上传文件目录
└── docs/                 # 文档
```

---

## 接口总览

### 1. 认证模块 (`/api/v1/auth`)

| 方法 | 路径        | 说明     | 权限 |
| ---- | ----------- | -------- | ---- |
| POST | `/register` | 用户注册 | 公开 |
| POST | `/login`    | 用户登录 | 公开 |

### 2. 商户端模块 (`/api/v1/hotels`)

面向 PC 端商户后台，提供酒店信息管理功能。

| 方法 | 路径         | 说明                         | 权限     |
| ---- | ------------ | ---------------------------- | -------- |
| GET  | `/my`        | 获取我的酒店信息             | merchant |
| PUT  | `/my`        | 更新酒店信息（支持版本控制） | merchant |
| PUT  | `/my/submit` | 提交审核                     | merchant |
| PUT  | `/my/cancel` | 取消提交                     | merchant |

**核心功能：**

- 酒店信息 CRUD
- 房型管理（增删改查）
- 图片上传与管理
- 审核提交流程

### 3. 管理员模块 (`/api/v1/admin`)

面向 PC 端管理员后台，提供审核和运营管理功能。

#### 3.1 酒店管理

| 方法 | 路径                  | 说明                       | 权限  |
| ---- | --------------------- | -------------------------- | ----- |
| GET  | `/hotels`             | 获取酒店列表（分页、筛选） | admin |
| GET  | `/hotels/:id`         | 获取酒店详情               | admin |
| PUT  | `/hotels/:id/approve` | 审核通过                   | admin |
| PUT  | `/hotels/:id/reject`  | 审核不通过                 | admin |
| PUT  | `/hotels/:id/publish` | 发布酒店                   | admin |
| PUT  | `/hotels/:id/offline` | 下线酒店                   | admin |
| PUT  | `/hotels/:id/restore` | 恢复上线                   | admin |

#### 3.2 Banner 管理

| 方法 | 路径                      | 说明             | 权限  |
| ---- | ------------------------- | ---------------- | ----- |
| GET  | `/banners`                | 获取 Banner 列表 | admin |
| PUT  | `/hotels/:id/banner`      | 设置/取消 Banner | admin |
| PUT  | `/hotels/:id/banner-info` | 更新 Banner 信息 | admin |

#### 3.3 Dashboard 统计

| 方法 | 路径               | 说明         | 权限  |
| ---- | ------------------ | ------------ | ----- |
| GET  | `/dashboard/stats` | 获取统计数据 | admin |

### 4. 移动端模块 (`/api/v1/mobile`)

面向 C 端移动应用，提供酒店搜索、详情、筛选等功能。

#### 4.1 Banner 模块

| 方法 | 路径       | 说明                 | 权限 |
| ---- | ---------- | -------------------- | ---- |
| GET  | `/banners` | 获取首页 Banner 列表 | 公开 |

#### 4.2 酒店搜索模块

| 方法 | 路径             | 说明     | 权限 |
| ---- | ---------------- | -------- | ---- |
| GET  | `/hotels/search` | 酒店搜索 | 公开 |
| GET  | `/hotels`        | 酒店列表 | 公开 |
| GET  | `/hotels/:id`    | 酒店详情 | 公开 |

**搜索功能特性：**

- 关键词搜索（酒店名称、地址）
- 多维度筛选（星级、价格区间、设施）
- 智能排序（综合、价格、评分）
- 分页加载

#### 4.3 筛选配置模块

| 方法 | 路径               | 说明         | 权限 |
| ---- | ------------------ | ------------ | ---- |
| GET  | `/filters/options` | 获取筛选选项 | 公开 |
| GET  | `/filters/tags`    | 获取标签列表 | 公开 |

### 5. 上传模块 (`/api/v1/upload`)

| 方法 | 路径      | 说明     | 权限           |
| ---- | --------- | -------- | -------------- |
| POST | `/image`  | 单图上传 | merchant/admin |
| POST | `/images` | 多图上传 | merchant/admin |

---

## 核心功能实现

### 1. 版本控制机制

#### 核心原理

已发布/已下线的酒店，在审核期间保持原版本数据，客户端仍可正常访问。新修改的数据存储在 `draftData` 字段中，审核通过后才合并到主数据。

#### 数据存储规则

| 酒店状态          | 修改操作 | 数据存储位置   |
| ----------------- | -------- | -------------- |
| draft/rejected    | 直接更新 | 主数据字段     |
| published/offline | 更新草稿 | draftData 字段 |

#### 状态流转

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

#### 关键代码

**商户端更新酒店（版本控制）**:

```javascript
if (isOnlineStatus(hotel.status)) {
  // 已上线酒店：新数据存入 draftData
  const newDraftData = { ...currentData, ...updateData }
  await prisma.hotel.update({
    where: { creatorId: userId },
    data: { draftData: newDraftData },
  })
} else {
  // 草稿/审核不通过：直接更新主数据
  await prisma.hotel.update({
    where: { creatorId: userId },
    data: { ...updateData, status: 'draft' },
  })
}
```

**管理员审核通过（合并数据）**:

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

### 2. 移动端搜索与筛选

#### 智能搜索

支持多字段模糊搜索：

```javascript
const searchConditions = [
  { nameZh: { contains: keyword } },
  { nameEn: { contains: keyword } },
  { address: { contains: keyword } },
]
```

#### 多维度筛选

| 筛选维度 | 说明                   |
| -------- | ---------------------- |
| 星级     | 1-5 星多选             |
| 价格区间 | 自定义价格范围         |
| 设施     | WiFi、停车场、健身房等 |
| 标签     | 豪华、景点、免费停车等 |

#### 智能排序

| 排序方式     | 算法                |
| ------------ | ------------------- |
| 综合排序     | 星级 + 价格综合评分 |
| 价格从低到高 | 最低房型价格升序    |
| 价格从高到低 | 最高房型价格降序    |
| 评分最高     | 星级降序            |

#### 优惠计算

自动选择最优惠方案：

```javascript
const getBestDiscount = (originalPrice, discounts) => {
  let bestDiscount = null
  let lowestPrice = originalPrice

  for (const discount of discounts) {
    const discountedPrice = calculateDiscountedPrice(originalPrice, discount)
    if (discountedPrice < lowestPrice) {
      lowestPrice = discountedPrice
      bestDiscount = discount
    }
  }

  return { finalPrice: lowestPrice, bestDiscount }
}
```

### 3. 图片版本管理

支持草稿/已发布双版本图片存储：

| 状态      | 说明                   |
| --------- | ---------------------- |
| draft     | 草稿图片（编辑中）     |
| published | 已发布图片（线上展示） |
| archived  | 归档图片（历史版本）   |

**审核通过时图片状态流转**:

```javascript
// 1. 将当前 published 图片归档
await prisma.hotelimage.updateMany({
  where: { hotelId, status: 'published' },
  data: { status: 'archived' },
})

// 2. 将 draft 图片发布
await prisma.hotelimage.updateMany({
  where: { hotelId, status: 'draft' },
  data: { status: 'published' },
})
```

### 4. Banner 运营系统

支持首页轮播 Banner 管理：

| 功能        | 说明                    |
| ----------- | ----------------------- |
| 设置 Banner | 已发布酒店可设为 Banner |
| 排序        | 支持自定义排序权重      |
| 标题/描述   | 独立配置展示文案        |
| 状态控制    | 随时上下线 Banner       |

---

## 数据模型

### 核心实体

| 实体       | 说明     | 主要字段                     |
| ---------- | -------- | ---------------------------- |
| user       | 用户     | id, username, password, role |
| hotel      | 酒店     | 基础信息、状态、draftData    |
| hotelimage | 酒店图片 | url, status, type, sortOrder |

### 酒店状态

| 状态      | 说明               |
| --------- | ------------------ |
| draft     | 草稿               |
| pending   | 待审核             |
| approved  | 审核通过（待发布） |
| published | 已发布             |
| offline   | 已下线             |
| rejected  | 审核不通过         |

---

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

### 权限控制

| 角色     | 权限                            |
| -------- | ------------------------------- |
| merchant | 管理自己的酒店信息              |
| admin    | 审核酒店、Banner 管理、查看统计 |

---

## 统一响应格式

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### 响应码

| 码值 | 说明           |
| ---- | -------------- |
| 200  | 成功           |
| 201  | 创建成功       |
| 400  | 请求参数错误   |
| 401  | 未授权         |
| 403  | 禁止访问       |
| 404  | 资源不存在     |
| 500  | 服务器内部错误 |

---

## 环境变量

```env
# 数据库连接
DATABASE_URL="mysql://root:@localhost:3306/yisu-hotel-db"

# JWT 密钥
JWT_SECRET="your-secret-key-here"

# 服务器端口
PORT=3000

# 高德地图（移动端定位用）
AMAP_KEY="your-amap-key"
```

---

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

---

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
5. **文件上传**: 类型限制、大小限制（5MB）
6. **权限控制**: 基于角色的访问控制

---

## 性能优化

1. **数据库索引**: status、starRating 字段已建索引
2. **连接池**: Prisma 默认配置
3. **静态资源**: 可迁移至 CDN
4. **缓存**: 可使用 Redis 缓存热点数据
5. **分页**: 列表接口默认分页，避免大数据量查询

---

## 扩展建议

1. **日志系统**: 集成 Winston 或 Pino
2. **API 文档**: 集成 Swagger/OpenAPI
3. **测试**: 添加单元测试和集成测试
4. **监控**: 集成 APM 工具（如 Sentry）
5. **消息队列**: 审核通知可使用消息队列
6. **缓存层**: 引入 Redis 缓存热门酒店数据
