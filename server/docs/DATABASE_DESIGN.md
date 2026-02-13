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
| draftData         | JSON          | NULL                        | -               | 草稿数据（版本控制）   |
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

```sql
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
  `draftData` JSON NULL COMMENT '草稿数据（版本控制）',
  `creatorId` INT NOT NULL COMMENT '创建者ID',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_creator` (`creatorId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_star_rating` (`starRating`),
  CONSTRAINT `fk_hotel_creator` FOREIGN KEY (`creatorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='酒店信息表';
```

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
  draftData          Json?
  creatorId          Int          @unique
  creator            User         @relation(fields: [creatorId], references: [id])
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([status])
  @@index([starRating])
  @@map("Hotel")
}
```

---

## 数据关系

```
User (1) ---- (0..1) Hotel
  │                    │
  │                    │
  └── creatorId ───────┘ (UNIQUE)
```

**一个商户账号只对应一个酒店**（一对一关系）。

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
