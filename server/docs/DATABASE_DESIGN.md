# 数据库设计文档

## 概述

本文档描述易宿酒店预订平台 PC 端的数据库设计，包含用户管理和酒店信息管理两个核心模块。

## 数据库配置

- **数据库类型**: MySQL
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **连接配置**: 环境变量 `DATABASE_URL`

---

## 数据表

### 1. User 表（已实现）

用户信息表，存储系统用户的基本信息和角色。

#### 表结构

| 字段名    | 类型                      | 约束                        | 默认值 | 说明                |
| --------- | ------------------------- | --------------------------- | ------ | ------------------- |
| id        | INT                       | PRIMARY KEY, AUTO_INCREMENT | -      | 用户ID，主键        |
| username  | VARCHAR(50)               | UNIQUE, NOT NULL            | -      | 用户名，唯一        |
| password  | VARCHAR(255)              | NOT NULL                    | -      | 密码（bcrypt 加密） |
| role      | ENUM('merchant', 'admin') | NOT NULL                    | -      | 用户角色            |
| createdAt | DATETIME                  | NOT NULL                    | NOW()  | 创建时间            |

#### 角色说明

| 角色   | 英文     | 权限说明                                                 |
| ------ | -------- | -------------------------------------------------------- |
| 商户   | merchant | 可录入、编辑、修改自己的酒店信息（一个商户对应一个酒店） |
| 管理员 | admin    | 可审核、发布、下线所有酒店信息                           |

---

### 2. Hotel 表

酒店信息表，存储酒店的详细信息。**一个商户账号只对应一个酒店**。

#### 表结构

| 字段名            | 类型          | 约束                        | 默认值          | 说明                   |
| ----------------- | ------------- | --------------------------- | --------------- | ---------------------- |
| id                | INT           | PRIMARY KEY, AUTO_INCREMENT | -               | 酒店ID，主键           |
| nameZh            | VARCHAR(100)  | NOT NULL                    | -               | 酒店中文名（必须）     |
| nameEn            | VARCHAR(100)  | NULL                        | -               | 酒店英文名（必须）     |
| address           | VARCHAR(255)  | NOT NULL                    | -               | 酒店地址（必须）       |
| starRating        | TINYINT       | NOT NULL                    | -               | 酒店星级（必须，1-5）  |
| roomTypes         | JSON          | NOT NULL                    | -               | 房型信息（必须）       |
| price             | DECIMAL(10,2) | NOT NULL                    | -               | 酒店基础价格（必须）   |
| openDate          | DATE          | NOT NULL                    | -               | 开业时间（必须）       |
| nearbyAttractions | TEXT          | NULL                        | -               | 附近热门景点（可选）   |
| nearbyTransport   | TEXT          | NULL                        | -               | 附近交通信息（可选）   |
| nearbyMalls       | TEXT          | NULL                        | -               | 附近商场信息（可选）   |
| discounts         | JSON          | NULL                        | -               | 优惠信息（可选）       |
| images            | JSON          | NULL                        | -               | 酒店图片（可选）       |
| description       | TEXT          | NULL                        | -               | 酒店描述（可选）       |
| status            | ENUM          | NOT NULL                    | 'draft'         | 酒店状态               |
| rejectReason      | VARCHAR(255)  | NULL                        | -               | 审核不通过原因         |
| auditInfo         | VARCHAR(500)  | NULL                        | -               | 商户提交的审核信息     |
| draftData         | JSON          | NULL                        | -               | 草稿数据（版本控制）   |
| isBanner          | BOOLEAN       | NOT NULL                    | false           | 是否设为 Banner        |
| bannerSort        | INT           | NOT NULL                    | 0               | Banner 排序位置        |
| bannerTitle       | VARCHAR(100)  | NULL                        | -               | Banner 标题            |
| bannerDesc        | VARCHAR(200)  | NULL                        | -               | Banner 描述/副标题     |
| creatorId         | INT           | UNIQUE, FOREIGN KEY         | -               | 创建者ID（商户，唯一） |
| createdAt         | DATETIME      | NOT NULL                    | NOW()           | 创建时间               |
| updatedAt         | DATETIME      | NOT NULL                    | NOW() ON UPDATE | 更新时间               |

#### 必须维度

| 字段名     | 说明            |
| ---------- | --------------- |
| nameZh     | 酒店中文名      |
| nameEn     | 酒店英文名      |
| address    | 酒店地址        |
| starRating | 酒店星级（1-5） |
| roomTypes  | 酒店房型        |
| price      | 酒店价格        |
| openDate   | 酒店开业时间    |

#### 可选维度

| 字段名            | 说明                    |
| ----------------- | ----------------------- |
| nearbyAttractions | 酒店附近的热门景点      |
| nearbyTransport   | 酒店附近的交通          |
| nearbyMalls       | 酒店附近的商场          |
| discounts         | 酒店价格的打折/优惠场景 |

#### 字段详细说明

**roomTypes**（必须）

- 类型: JSON
- 约束: NOT NULL
- 说明: 房型信息，JSON 数组格式
- 示例:

```json
[
  {
    "name": "标准间",
    "price": 299,
    "area": 25,
    "bedType": "大床/双床",
    "facilities": ["WiFi", "空调", "电视", "独立卫浴"]
  },
  {
    "name": "豪华套房",
    "price": 599,
    "area": 45,
    "bedType": "大床",
    "facilities": ["WiFi", "空调", "电视", "独立卫浴", "浴缸", "迷你吧"]
  }
]
```

**nearbyAttractions**（可选）

- 类型: TEXT
- 约束: NULL
- 说明: 附近热门景点，多个用逗号分隔
- 示例: "西湖,灵隐寺,雷峰塔"

**nearbyTransport**（可选）

- 类型: TEXT
- 约束: NULL
- 说明: 附近交通信息
- 示例: "地铁1号线龙翔桥站,公交K4路"

**nearbyMalls**（可选）

- 类型: TEXT
- 约束: NULL
- 说明: 附近商场信息
- 示例: "银泰百货,湖滨银泰"

**discounts**（可选）

- 类型: JSON
- 约束: NULL
- 说明: 优惠信息，JSON 数组格式
- 示例:

```json
[
  {
    "type": "percentage",
    "name": "春节特惠",
    "value": 80,
    "description": "春节期间入住享8折优惠",
    "startDate": "2026-01-25",
    "endDate": "2026-02-10"
  },
  {
    "type": "fixed",
    "name": "机酒套餐",
    "value": 200,
    "description": "机票+酒店套餐立减200元",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  }
]
```

**images**（可选）

- 类型: JSON
- 约束: NULL
- 说明: 酒店图片URL列表
- 示例:

```json
[
  "https://example.com/hotel1.jpg",
  "https://example.com/hotel2.jpg",
  "https://example.com/hotel3.jpg"
]
```

**status**

- 类型: ENUM
- 约束: NOT NULL
- 默认值: 'draft'
- 说明: 酒店状态
- 可选值:

| 状态值    | 中文       | 说明                   |
| --------- | ---------- | ---------------------- |
| draft     | 草稿       | 商户编辑中，未提交审核 |
| pending   | 审核中     | 已提交，等待管理员审核 |
| approved  | 审核通过   | 管理员审核通过         |
| rejected  | 审核不通过 | 管理员审核不通过       |
| published | 已发布     | 已发布上线，用户可见   |
| offline   | 已下线     | 已下线，用户不可见     |

**auditInfo**（审核信息）

- 类型: VARCHAR(500)
- 约束: NULL
- 说明: 商户提交审核时填写的备注信息，供管理员查看
- 示例: "本次更新了酒店图片和房型价格，请审核"

**isBanner**（Banner 标记）

- 类型: BOOLEAN
- 约束: NOT NULL
- 默认值: false
- 说明: 标记该酒店是否设为首页 Banner 展示
- 注意: 只有已发布状态的酒店才能设为 Banner

**bannerSort**（Banner 排序）

- 类型: INT
- 约束: NOT NULL
- 默认值: 0
- 说明: Banner 展示顺序，数字越小越靠前
- 示例: 1, 2, 3...

**bannerTitle**（Banner 标题）

- 类型: VARCHAR(100)
- 约束: NULL
- 说明: Banner 展示标题，默认使用酒店名称，可自定义
- 示例: "杭州西湖希尔顿 - 限时特惠"

**bannerDesc**（Banner 描述）

- 类型: VARCHAR(200)
- 约束: NULL
- 说明: Banner 副标题/描述，用于展示促销信息或卖点
- 示例: "春节特惠 8折起，立即预订"

**draftData**（版本控制）

- 类型: JSON
- 约束: NULL
- 说明: 草稿数据，用于已上线酒店的版本控制
- 用途: 已发布/已下线酒店修改时，新数据存储在此字段，审核通过后合并到主数据
- 示例:

```json
{
  "nameZh": "杭州西湖希尔顿酒店（新版）",
  "nameEn": "Hilton Hangzhou West Lake",
  "address": "浙江省杭州市西湖区曙光路120号",
  "starRating": 5,
  "roomTypes": [...],
  "price": 688,
  "openDate": "2018-06-01",
  "nearbyAttractions": "西湖,灵隐寺,雷峰塔",
  "nearbyTransport": "地铁1号线龙翔桥站,公交K4路",
  "nearbyMalls": "银泰百货,湖滨银泰",
  "discounts": [...],
  "images": [...],
  "description": "..."
}
```

**creatorId**

- 类型: INT
- 约束: UNIQUE, FOREIGN KEY REFERENCES User(id)
- 说明: 创建该酒店信息的商户ID，**一个商户只能有一个酒店**

#### 索引

| 索引名          | 字段       | 类型    | 说明                               |
| --------------- | ---------- | ------- | ---------------------------------- |
| PRIMARY         | id         | PRIMARY | 主键索引                           |
| uq_creator      | creatorId  | UNIQUE  | 创建者唯一索引（一个商户一个酒店） |
| idx_status      | status     | INDEX   | 状态索引                           |
| idx_star_rating | starRating | INDEX   | 星级索引                           |
| idx_is_banner   | isBanner   | INDEX   | Banner 标记索引                    |

---

### 3. HotelImage 表（新增）

酒店图片表，用于管理酒店的多张图片，支持分类存储和房型关联。

#### 表结构

| 字段名    | 类型         | 约束                        | 默认值          | 说明           |
| --------- | ------------ | --------------------------- | --------------- | -------------- |
| id        | INT          | PRIMARY KEY, AUTO_INCREMENT | -               | 图片ID，主键   |
| hotelId   | INT          | FOREIGN KEY, NOT NULL       | -               | 所属酒店ID     |
| url       | VARCHAR(500) | NOT NULL                    | -               | 图片URL        |
| type      | ENUM         | NOT NULL                    | 'hotel_main'    | 图片类型       |
| roomType  | VARCHAR(100) | NULL                        | -               | 房型名称       |
| version   | INT          | NOT NULL                    | 1               | 版本号         |
| status    | ENUM         | NOT NULL                    | 'draft'         | 图片状态       |
| sortOrder | INT          | NOT NULL                    | 0               | 排序顺序       |
| filename  | VARCHAR(255) | NULL                        | -               | 文件名         |
| fileSize  | INT          | NULL                        | -               | 文件大小(字节) |
| mimeType  | VARCHAR(100) | NULL                        | -               | MIME类型       |
| createdBy | INT          | FOREIGN KEY, NOT NULL       | -               | 创建者ID       |
| updatedBy | INT          | FOREIGN KEY, NOT NULL       | -               | 更新者ID       |
| createdAt | DATETIME     | NOT NULL                    | NOW()           | 创建时间       |
| updatedAt | DATETIME     | NOT NULL                    | NOW() ON UPDATE | 更新时间       |

#### 图片类型说明

| 类型         | 存储路径                                          | 说明       |
| ------------ | ------------------------------------------------- | ---------- |
| hotel_main   | uploads/hotels/{hotelId}/main/{date}/             | 酒店主图   |
| hotel_room   | uploads/hotels/{hotelId}/rooms/{roomType}/{date}/ | 房型图片   |
| hotel_banner | uploads/banners/{hotelId}/{date}/                 | Banner图片 |
| user_avatar  | uploads/avatars/{userId}/{date}/                  | 用户头像   |

#### 图片状态说明

| 状态      | 说明                 |
| --------- | -------------------- |
| draft     | 草稿状态，编辑时使用 |
| published | 已发布状态，线上展示 |
| archived  | 已归档，保留历史版本 |

#### 字段详细说明

**type**（图片类型）

- 类型: ENUM
- 约束: NOT NULL
- 默认值: 'hotel_main'
- 说明: 标记图片的用途分类
- 用途:
  - `hotel_main`: 酒店主图，用于封面、详情页展示
  - `hotel_room`: 房型图片，关联到具体房型
  - `hotel_banner`: Banner专用图，用于首页轮播
  - `user_avatar`: 用户头像

**roomType**（房型名称）

- 类型: VARCHAR(100)
- 约束: NULL
- 说明: 当 type 为 `hotel_room` 时使用，标记该图片属于哪个房型
- 示例: "标准间", "豪华套房"

**version**（版本号）

- 类型: INT
- 约束: NOT NULL
- 默认值: 1
- 说明: 图片版本号，每次发布时递增
- 用途: 用于版本控制和历史追溯

**status**（图片状态）

- 类型: ENUM
- 约束: NOT NULL
- 默认值: 'draft'
- 说明: 图片状态
- 可选值: draft（草稿）、published（已发布）、archived（已归档）

**sortOrder**（排序顺序）

- 类型: INT
- 约束: NOT NULL
- 默认值: 0
- 说明: 图片展示顺序，数字越小越靠前
- 用途: 控制图片在前端的展示顺序

**filename**（文件名）

- 类型: VARCHAR(255)
- 约束: NULL
- 说明: 原始文件名

**fileSize**（文件大小）

- 类型: INT
- 约束: NULL
- 说明: 文件大小（字节）

**mimeType**（MIME类型）

- 类型: VARCHAR(100)
- 约束: NULL
- 说明: 文件MIME类型，如 image/jpeg、image/png

**createdBy**（创建者）

- 类型: INT
- 约束: NOT NULL
- 说明: 创建该图片记录的用户ID

**updatedBy**（更新者）

- 类型: INT
- 约束: NOT NULL
- 说明: 最后更新该图片记录的用户ID

#### 索引

| 索引名                | 字段                           | 类型    | 说明                 |
| --------------------- | ------------------------------ | ------- | -------------------- |
| PRIMARY               | id                             | PRIMARY | 主键索引             |
| idx_hotel_type_status | (hotelId, type, status)        | INDEX   | 酒店ID+类型+状态索引 |
| idx_hotel_room_sort   | (hotelId, roomType, sortOrder) | INDEX   | 酒店ID+房型+排序索引 |
| idx_type_status       | (type, status)                 | INDEX   | 类型+状态索引        |

#### 关系说明

```
Hotel (1) ---- (0..n) HotelImage
  │                    │
  │                    │
  └── id ──────────────┘ (hotelId, FOREIGN KEY, CASCADE DELETE)
```

**一个酒店可以有多张图片**（一对多关系）。

---

## 状态流转图

```
商户操作流程:
draft (草稿)
    ↓ 提交审核
pending (审核中)
    ↓ 管理员审核
approved (审核通过) / rejected (审核不通过)
    ↓ 管理员发布
published (已发布)
    ↓ 管理员下线
offline (已下线)
    ↓ 管理员恢复
published (已发布)

版本控制流程（已发布/已下线酒店）:
published/offline
    ↓ 商户编辑（数据存入 draftData）
    ↓ 商户提交审核
pending (审核中，主数据不变，客户端仍展示原版本)
    ↓ 管理员审核通过
    ↓ draftData 合并到主数据
published (已发布，新版本)
```

---

## SQL 建表语句

````sql
CREATE TABLE `Hotel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nameZh` VARCHAR(100) NOT NULL COMMENT '酒店中文名',
  `nameEn` VARCHAR(100) NOT NULL COMMENT '酒店英文名',
  `address` VARCHAR(255) NOT NULL COMMENT '酒店地址',
  `starRating` TINYINT NOT NULL COMMENT '酒店星级(1-5)',
  `roomTypes` JSON NOT NULL COMMENT '房型信息',
  `price` DECIMAL(10,2) NOT NULL COMMENT '基础价格',
  `openDate` DATE NOT NULL COMMENT '开业时间',
  `nearbyAttractions` TEXT NULL COMMENT '附近景点',
  `nearbyTransport` TEXT NULL COMMENT '附近交通',
  `nearbyMalls` TEXT NULL COMMENT '附近商场',
  `discounts` JSON NULL COMMENT '优惠信息',
  `images` JSON NULL COMMENT '酒店图片',
  `description` TEXT NULL COMMENT '酒店描述',
  `status` ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'offline') NOT NULL DEFAULT 'draft' COMMENT '酒店状态',
  `rejectReason` VARCHAR(255) NULL COMMENT '审核不通过原因',
  `auditInfo` VARCHAR(500) NULL COMMENT '商户提交的审核信息',
  `draftData` JSON NULL COMMENT '草稿数据（版本控制）',
  `isBanner` BOOLEAN NOT NULL DEFAULT false COMMENT '是否设为Banner',
  `bannerSort` INT NOT NULL DEFAULT 0 COMMENT 'Banner排序位置',
  `bannerTitle` VARCHAR(100) NULL COMMENT 'Banner标题',
  `bannerDesc` VARCHAR(200) NULL COMMENT 'Banner描述',
  `creatorId` INT NOT NULL COMMENT '创建者ID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_creator` (`creatorId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_star_rating` (`starRating`),
  INDEX `idx_is_banner` (`isBanner`),
  CONSTRAINT `fk_hotel_creator` FOREIGN KEY (`creatorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='酒店信息表';

CREATE TABLE `HotelImage` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `hotelId` INT NOT NULL COMMENT '所属酒店ID',
  `url` VARCHAR(500) NOT NULL COMMENT '图片URL',
  `type` ENUM('hotel_main', 'hotel_room', 'hotel_banner', 'user_avatar') NOT NULL DEFAULT 'hotel_main' COMMENT '图片类型',
  `roomType` VARCHAR(100) NULL COMMENT '房型名称（当type为hotel_room时使用）',
  `version` INT NOT NULL DEFAULT 1 COMMENT '版本号',
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft' COMMENT '图片状态',
  `sortOrder` INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `filename` VARCHAR(255) NULL COMMENT '文件名',
  `fileSize` INT NULL COMMENT '文件大小(字节)',
  `mimeType` VARCHAR(100) NULL COMMENT 'MIME类型',
  `createdBy` INT NOT NULL COMMENT '创建者ID',
  `updatedBy` INT NOT NULL COMMENT '更新者ID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_hotel_id` (`hotelId`),
  INDEX `idx_type` (`type`),
  INDEX `idx_room_type` (`roomType`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_hotel_image_hotel` FOREIGN KEY (`hotelId`) REFERENCES `Hotel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_hotel_image_creator` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_hotel_image_updater` FOREIGN KEY (`updatedBy`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='酒店图片表';

---

## Prisma Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  password  String   @db.VarChar(255)
  role      Role     @default(merchant)
  createdAt DateTime @default(now())
  hotel     Hotel?

  @@map("User")
}

enum Role {
  merchant
  admin
}

enum HotelStatus {
  draft     // 草稿
  pending   // 审核中
  approved  // 审核通过
  rejected  // 审核不通过
  published // 已发布
  offline   // 已下线
}

model Hotel {
  id                 Int          @id @default(autoincrement())
  nameZh             String       @db.VarChar(100)
  nameEn             String       @db.VarChar(100)
  address            String       @db.VarChar(255)
  starRating         Int
  roomTypes          Json
  price              Decimal      @db.Decimal(10, 2)
  openDate           DateTime     @db.Date
  nearbyAttractions  String?
  nearbyTransport    String?
  nearbyMalls        String?
  discounts          Json?
  images             Json?
  description        String?
  status             HotelStatus  @default(draft)
  rejectReason       String?      @db.VarChar(255)
  auditInfo          String?      @db.VarChar(500)  // 商户提交的审核信息
  draftData          Json?

  // Banner 相关字段
  isBanner           Boolean      @default(false)   // 是否设为 Banner
  bannerSort         Int          @default(0)       // Banner 排序（0表示未设置）
  bannerTitle        String?      @db.VarChar(100)  // Banner 标题（默认酒店名）
  bannerDesc         String?      @db.VarChar(200)  // Banner 描述/副标题

  creatorId          Int          @unique
  creator            User         @relation(fields: [creatorId], references: [id])
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([status])
  @@index([starRating])
  @@index([isBanner])
  @@map("Hotel")
}

// 图片类型枚举
enum ImageType {
  hotel_main      // 酒店主图（封面、详情展示）
  hotel_room      // 房型图片
  hotel_banner    // Banner专用图
  user_avatar     // 用户头像
}

// 图片状态枚举
enum ImageStatus {
  draft       // 草稿
  published   // 已发布
  archived    // 已归档
}

// 酒店图片表（用于管理多张图片）
model HotelImage {
  id         Int         @id @default(autoincrement())
  hotelId    Int
  hotel      Hotel       @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  url        String      @db.VarChar(500)  // 图片URL
  type       ImageType   @default(hotel_main)  // 图片类型
  roomType   String?     @db.VarChar(100)  // 房型名称（当type为hotel_room时使用）

  // 版本控制
  version    Int         @default(1)
  status     ImageStatus @default(draft)

  // 排序
  sortOrder  Int         @default(0)

  // 元数据
  filename   String?     @db.VarChar(255)
  fileSize   Int?
  mimeType   String?     @db.VarChar(100)

  // 审计字段
  createdBy  Int
  updatedBy  Int
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@index([hotelId, type, status])
  @@index([hotelId, roomType, sortOrder])
  @@index([type, status])
  @@map("HotelImage")
}

---

## 数据关系

````

User (1) ---- (0..1) Hotel
│ │
│ │
└── creatorId ───────┘ (UNIQUE)

Hotel (1) ---- (0..n) HotelImage
│ │
│ │
└── id ──────────────┘ (hotelId, FOREIGN KEY, CASCADE DELETE)

```

- **一个商户账号只对应一个酒店**（一对一关系）
- **一个酒店可以有多张图片**（一对多关系）

---

## 版本控制机制

### 核心原理

已发布/已下线的酒店，在审核期间保持原版本数据，客户端仍可正常访问。新修改的数据存储在 `draftData` 字段中，审核通过后才合并到主数据。

### 数据存储规则

| 酒店状态          | 修改操作 | 数据存储位置   |
| ----------------- | -------- | -------------- |
| draft/rejected    | 直接更新 | 主数据字段     |
| published/offline | 更新草稿 | draftData 字段 |

### 流程说明

1. **商户编辑已发布酒店**
   - 主数据不变，新数据存入 `draftData`
   - 客户端仍展示主数据（原版本）

2. **商户提交审核**
   - 状态变为 `pending`
   - 主数据不变

3. **管理员审核通过**
   - `draftData` 合并到主数据
   - `draftData` 清空
   - 状态变为 `approved`

4. **管理员审核不通过**
   - 主数据不变
   - `draftData` 保留
   - 商户可再次修改后重新提交

---

## 注意事项

1. **一对一关系**: creatorId 设置为 UNIQUE，确保一个商户只能有一个酒店
2. **必须字段**: nameZh, nameEn, address, starRating, roomTypes, price, openDate 为必填字段
3. **可选字段**: nearbyAttractions, nearbyTransport, nearbyMalls, discounts 为可选字段
4. **状态管理**: 状态流转需遵循业务规则
5. **JSON 字段**: roomTypes、discounts、images、draftData 使用 JSON 存储，便于扩展
6. **价格精度**: 使用 DECIMAL(10,2) 确保价格计算精确
7. **审核记录**: rejectReason 仅在审核不通过时记录原因
8. **版本控制**: draftData 用于已上线酒店的修改版本控制
9. **图片管理**: HotelImage 表用于管理酒店的多张图片，支持分类存储和房型关联
10. **级联删除**: 删除酒店时会自动删除关联的 HotelImage 记录（ON DELETE CASCADE）
```
