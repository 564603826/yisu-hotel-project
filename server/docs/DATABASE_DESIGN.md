# 数据库设计文档

## 概述

本文档描述亦宿酒店预订平台的数据库设计，支持 PC 端管理后台和移动端 C 端应用。数据库采用 PostgreSQL，包含用户管理、酒店信息管理、图片管理等核心模块。

## 数据库配置

- **数据库类型**: PostgreSQL
- **字符集**: UTF8
- **连接配置**: 环境变量 `DATABASE_URL`

---

## 数据表

### 1. user 表

用户信息表，存储系统用户的基本信息和角色。

#### 表结构

| 字段名    | 类型         | 约束                        | 默认值     | 说明                |
| --------- | ------------ | --------------------------- | ---------- | ------------------- |
| id        | INT          | PRIMARY KEY, AUTO_INCREMENT | -          | 用户ID，主键        |
| username  | VARCHAR(50)  | UNIQUE, NOT NULL            | -          | 用户名，唯一        |
| password  | VARCHAR(255) | NOT NULL                    | -          | 密码（bcrypt 加密） |
| role      | ENUM         | NOT NULL                    | 'merchant' | 用户角色            |
| createdAt | TIMESTAMP    | NOT NULL                    | NOW()      | 创建时间            |

#### 角色说明

| 角色   | 英文     | 权限说明                                                 |
| ------ | -------- | -------------------------------------------------------- |
| 商户   | merchant | 可录入、编辑、修改自己的酒店信息（一个商户对应一个酒店） |
| 管理员 | admin    | 可审核、发布、下线所有酒店信息，Banner 管理              |

#### 关系

```
user (1) ---- (0..1) hotel
```

一个用户（商户）最多对应一个酒店。

---

### 2. hotel 表

酒店信息表，存储酒店的详细信息。**一个商户账号只对应一个酒店**。

#### 表结构

| 字段名            | 类型          | 约束                        | 默认值  | 说明                   |
| ----------------- | ------------- | --------------------------- | ------- | ---------------------- |
| id                | INT           | PRIMARY KEY, AUTO_INCREMENT | -       | 酒店ID，主键           |
| nameZh            | VARCHAR(100)  | NOT NULL                    | -       | 酒店中文名             |
| nameEn            | VARCHAR(100)  | NOT NULL                    | -       | 酒店英文名             |
| address           | VARCHAR(255)  | NOT NULL                    | -       | 酒店地址               |
| starRating        | INT           | NOT NULL                    | -       | 酒店星级（1-5）        |
| roomTypes         | JSON          | NOT NULL                    | -       | 房型信息               |
| price             | DECIMAL(10,2) | NOT NULL                    | -       | 酒店基础价格           |
| openDate          | DATE          | NOT NULL                    | -       | 开业时间               |
| nearbyAttractions | TEXT          | NULL                        | -       | 附近热门景点           |
| nearbyTransport   | TEXT          | NULL                        | -       | 附近交通信息           |
| nearbyMalls       | TEXT          | NULL                        | -       | 附近商场信息           |
| facilities        | JSON          | NULL                        | -       | 设施列表               |
| discounts         | JSON          | NULL                        | -       | 优惠信息               |
| description       | TEXT          | NULL                        | -       | 酒店描述               |
| status            | ENUM          | NOT NULL                    | 'draft' | 酒店状态               |
| rejectReason      | VARCHAR(255)  | NULL                        | -       | 审核不通过原因         |
| auditInfo         | VARCHAR(500)  | NULL                        | -       | 商户提交的审核信息     |
| draftData         | JSON          | NULL                        | -       | 草稿数据（版本控制）   |
| isBanner          | BOOLEAN       | NOT NULL                    | false   | 是否设为 Banner        |
| bannerSort        | INT           | NOT NULL                    | 0       | Banner 排序位置        |
| bannerTitle       | VARCHAR(100)  | NULL                        | -       | Banner 标题            |
| bannerDesc        | VARCHAR(200)  | NULL                        | -       | Banner 描述            |
| creatorId         | INT           | UNIQUE, FOREIGN KEY         | -       | 创建者ID（商户，唯一） |
| createdAt         | TIMESTAMP     | NOT NULL                    | NOW()   | 创建时间               |
| updatedAt         | TIMESTAMP     | NOT NULL                    | NOW()   | 更新时间               |

#### 字段详细说明

**roomTypes**（房型信息）

- 类型: JSON
- 约束: NOT NULL
- 说明: 房型信息数组
- 示例:

```json
[
  {
    "name": "标准间",
    "price": 299,
    "area": 25,
    "bedType": "大床/双床",
    "bedCount": 1,
    "bedSize": "1.8m",
    "facilities": ["WiFi", "空调", "电视", "独立卫浴"],
    "count": 10
  }
]
```

**facilities**（设施列表）

- 类型: JSON
- 约束: NULL
- 说明: 酒店设施列表
- 示例: `["免费WiFi", "停车场", "健身房", "游泳池"]`

**discounts**（优惠信息）

- 类型: JSON
- 约束: NULL
- 说明: 优惠信息数组
- 示例:

```json
[
  {
    "type": "percentage",
    "name": "春节特惠",
    "value": 20,
    "description": "春节期间入住享8折优惠"
  },
  {
    "type": "fixed",
    "name": "新客立减",
    "value": 50,
    "description": "新用户首单立减50元"
  }
]
```

**status**（酒店状态）

| 状态值    | 中文       | 说明                   |
| --------- | ---------- | ---------------------- |
| draft     | 草稿       | 商户编辑中，未提交审核 |
| pending   | 审核中     | 已提交，等待管理员审核 |
| approved  | 审核通过   | 管理员审核通过，待发布 |
| rejected  | 审核不通过 | 管理员审核不通过       |
| published | 已发布     | 已发布上线，用户可见   |
| offline   | 已下线     | 已下线，用户不可见     |

**draftData**（版本控制）

- 类型: JSON
- 约束: NULL
- 说明: 已上线酒店修改时，新数据存储在此字段
- 用途: 审核期间保持原版本数据，审核通过后合并到主数据

**isBanner / bannerSort / bannerTitle / bannerDesc**（Banner 运营）

- 用于移动端首页轮播 Banner 展示
- 只有已发布状态的酒店才能设为 Banner
- 支持自定义标题和描述

#### 索引

| 索引名               | 字段       | 类型    | 说明            |
| -------------------- | ---------- | ------- | --------------- |
| PRIMARY              | id         | PRIMARY | 主键索引        |
| Hotel_creatorId_key  | creatorId  | UNIQUE  | 创建者唯一索引  |
| Hotel_status_idx     | status     | INDEX   | 状态索引        |
| Hotel_starRating_idx | starRating | INDEX   | 星级索引        |
| Hotel_isBanner_idx   | isBanner   | INDEX   | Banner 标记索引 |

#### 关系

```
hotel (1) ---- (0..n) hotelimage
  │
  └── creatorId ----> user.id
```

---

### 3. hotelimage 表

酒店图片表，用于管理酒店的多张图片，支持分类存储、版本控制和房型关联。

#### 表结构

| 字段名    | 类型         | 约束                        | 默认值       | 说明           |
| --------- | ------------ | --------------------------- | ------------ | -------------- |
| id        | INT          | PRIMARY KEY, AUTO_INCREMENT | -            | 图片ID，主键   |
| hotelId   | INT          | FOREIGN KEY, NOT NULL       | -            | 所属酒店ID     |
| url       | VARCHAR(500) | NOT NULL                    | -            | 图片URL        |
| type      | ENUM         | NOT NULL                    | 'hotel_main' | 图片类型       |
| roomType  | VARCHAR(100) | NULL                        | -            | 房型名称       |
| version   | INT          | NOT NULL                    | 1            | 版本号         |
| status    | ENUM         | NOT NULL                    | 'draft'      | 图片状态       |
| sortOrder | INT          | NOT NULL                    | 0            | 排序顺序       |
| filename  | VARCHAR(255) | NULL                        | -            | 文件名         |
| fileSize  | INT          | NULL                        | -            | 文件大小(字节) |
| mimeType  | VARCHAR(100) | NULL                        | -            | MIME类型       |
| createdBy | INT          | FOREIGN KEY, NOT NULL       | -            | 创建者ID       |
| updatedBy | INT          | FOREIGN KEY, NOT NULL       | -            | 更新者ID       |
| createdAt | TIMESTAMP    | NOT NULL                    | NOW()        | 创建时间       |
| updatedAt | TIMESTAMP    | NOT NULL                    | NOW()        | 更新时间       |

#### 图片类型说明

| 类型         | 说明                           |
| ------------ | ------------------------------ |
| hotel_main   | 酒店主图，用于封面、详情页展示 |
| hotel_room   | 房型图片，关联到具体房型       |
| hotel_banner | Banner专用图，用于首页轮播     |
| user_avatar  | 用户头像                       |

#### 图片状态说明

| 状态      | 说明                 |
| --------- | -------------------- |
| draft     | 草稿状态，编辑时使用 |
| published | 已发布状态，线上展示 |
| archived  | 已归档，保留历史版本 |

#### 版本控制

图片支持三态版本管理：

1. **draft**: 商户编辑时上传的图片
2. **published**: 审核通过后对外展示的图片
3. **archived**: 历史版本，保留用于追溯

**审核通过时的状态流转**:

```
published -> archived (旧版本归档)
draft -> published (新版本发布)
```

#### 索引

| 索引名                                    | 字段                           | 类型    | 说明               |
| ----------------------------------------- | ------------------------------ | ------- | ------------------ |
| PRIMARY                                   | id                             | PRIMARY | 主键索引           |
| hotelimage_hotelId_type_status_idx        | (hotelId, type, status)        | INDEX   | 酒店+类型+状态索引 |
| hotelimage_hotelId_roomType_sortOrder_idx | (hotelId, roomType, sortOrder) | INDEX   | 酒店+房型+排序索引 |
| hotelimage_type_status_idx                | (type, status)                 | INDEX   | 类型+状态索引      |

#### 关系

```
hotel (1) ---- (0..n) hotelimage
  │                    │
  └── id <------------- hotelId (FOREIGN KEY, CASCADE DELETE)
```

---

## 状态流转

### 酒店状态流转

```
                    ┌─────────────┐
                    │    draft    │
                    │   (草稿)    │
                    └──────┬──────┘
                           │ 提交审核
                           ▼
                    ┌─────────────┐
         ┌─────────│   pending   │─────────┐
         │         │  (审核中)   │         │
         │         └──────┬──────┘         │
         │                │                │
   审核不通过              │ 审核通过        │
         │                ▼                │
         │         ┌─────────────┐         │
         └────────►│  approved   │◄────────┘
                   │ (审核通过)  │
                   └──────┬──────┘
                          │ 发布
                          ▼
                   ┌─────────────┐
              ┌────│  published  │────┐
              │    │  (已发布)   │    │
              │    └──────┬──────┘    │
              │           │           │
           下线           │          恢复上线
              │           │           │
              │    ┌──────┴──────┐    │
              └───►│   offline   │────┘
                   │  (已下线)   │
                   └─────────────┘
```

### 版本控制流程

```
published/offline (已上线酒店)
    │
    ├── 商户编辑 ──> 数据存入 draftData，主数据不变
    │                  │
    ├── 商户提交审核 ──> 状态变为 pending
    │                       │
    │                       ├── 审核通过 ──> draftData 合并到主数据
    │                       │                  │
    │                       │                  ▼
    │                       │           published (新版本)
    │                       │
    │                       └── 审核不通过 ──> 状态变为 rejected
    │                                            │
    │                                            ▼
    │                                      rejected (保留 draftData)
    │
    └── 商户取消提交 ──> 恢复为 published（如有 draftData）
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model hotel {
  id                Int          @id @default(autoincrement())
  nameZh            String       @db.VarChar(100)
  nameEn            String       @db.VarChar(100)
  address           String       @db.VarChar(255)
  starRating        Int
  roomTypes         Json
  price             Decimal      @db.Decimal(10, 2)
  openDate          DateTime     @db.Date
  nearbyAttractions String?
  nearbyTransport   String?
  nearbyMalls       String?
  facilities        Json?
  discounts         Json?
  description       String?      @db.Text
  status            hotel_status @default(draft)
  rejectReason      String?      @db.VarChar(255)
  creatorId         Int          @unique(map: "Hotel_creatorId_key")
  createdAt         DateTime     @default(now())
  updatedAt         DateTime
  auditInfo         String?      @db.VarChar(500)
  bannerDesc        String?      @db.VarChar(200)
  bannerSort        Int          @default(0)
  bannerTitle       String?      @db.VarChar(100)
  draftData         Json?
  isBanner          Boolean      @default(false)
  user              user         @relation(fields: [creatorId], references: [id], map: "Hotel_creatorId_fkey")
  hotelimage        hotelimage[]

  @@index([isBanner], map: "Hotel_isBanner_idx")
  @@index([starRating], map: "Hotel_starRating_idx")
  @@index([status], map: "Hotel_status_idx")
}

model hotelimage {
  id        Int             @id @default(autoincrement())
  hotelId   Int
  url       String          @db.VarChar(500)
  type      hotelimage_type @default(hotel_main)
  roomType  String?         @db.VarChar(100)
  version   Int             @default(1)
  status    image_status    @default(draft)
  sortOrder Int             @default(0)
  filename  String?         @db.VarChar(255)
  fileSize  Int?
  mimeType  String?         @db.VarChar(100)
  createdBy Int
  updatedBy Int
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  hotel     hotel           @relation(fields: [hotelId], references: [id], onDelete: Cascade, map: "HotelImage_hotelId_fkey")

  @@index([hotelId, type, status])
  @@index([hotelId, roomType, sortOrder])
  @@index([type, status])
}

model user {
  id        Int       @id @default(autoincrement())
  username  String    @unique(map: "User_username_key") @db.VarChar(50)
  password  String    @db.VarChar(255)
  role      user_role @default(merchant)
  createdAt DateTime  @default(now())
  hotel     hotel?
}

enum hotelimage_type {
  hotel_main
  hotel_room
  hotel_banner
  user_avatar
}

enum image_status {
  draft
  published
  archived
}

enum user_role {
  merchant
  admin
}

enum hotel_status {
  draft
  pending
  approved
  rejected
  published
  offline
}
```

---

## 设计亮点

### 1. 版本控制设计

- 使用 `draftData` JSON 字段存储待审核数据
- 已上线酒店修改时不影响线上展示
- 审核通过后原子性合并数据

### 2. 图片三态管理

- draft / published / archived 三种状态
- 支持版本号追溯
- 审核通过时自动状态流转

### 3. 设施与房型灵活性

- 设施使用 JSON 数组，支持动态扩展
- 房型信息包含完整配置（床型、面积、设施等）
- 支持多房型、多图片关联

### 4. Banner 运营支持

- 独立字段控制 Banner 展示
- 支持排序、自定义标题描述
- 只有已发布酒店可设为 Banner

### 5. 索引优化

- 高频查询字段建立索引（status、starRating、isBanner）
- 复合索引优化列表查询（hotelId + type + status）
- 唯一索引保证数据一致性（creatorId）
