# PC端接口设计文档

## 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

## 统一响应格式

所有接口返回统一的信封格式：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

---

## 接口列表

### 认证模块（已实现）

| 接口     | 方法 | 路径           | 说明     | 权限 |
| -------- | ---- | -------------- | -------- | ---- |
| 用户注册 | POST | /auth/register | 用户注册 | 公开 |
| 用户登录 | POST | /auth/login    | 用户登录 | 公开 |

---

### 酒店管理模块（商户端）

| 接口            | 方法 | 路径              | 说明                                 | 权限     |
| --------------- | ---- | ----------------- | ------------------------------------ | -------- |
| 获取/初始化酒店 | GET  | /hotels/my        | 获取商户的酒店信息（不存在则初始化） | merchant |
| 更新酒店信息    | PUT  | /hotels/my        | 更新酒店信息                         | merchant |
| 提交审核        | PUT  | /hotels/my/submit | 提交酒店审核                         | merchant |
| 取消提交        | PUT  | /hotels/my/cancel | 取消提交审核                         | merchant |

---

### 酒店审核模块（管理员端）

| 接口         | 方法 | 路径                      | 说明             | 权限  |
| ------------ | ---- | ------------------------- | ---------------- | ----- |
| 获取酒店列表 | GET  | /admin/hotels             | 获取所有酒店列表 | admin |
| 获取酒店详情 | GET  | /admin/hotels/:id         | 获取酒店详细信息 | admin |
| 审核通过     | PUT  | /admin/hotels/:id/approve | 审核通过         | admin |
| 审核不通过   | PUT  | /admin/hotels/:id/reject  | 审核不通过       | admin |
| 发布酒店     | PUT  | /admin/hotels/:id/publish | 发布酒店上线     | admin |
| 下线酒店     | PUT  | /admin/hotels/:id/offline | 下线酒店         | admin |
| 恢复上线     | PUT  | /admin/hotels/:id/restore | 恢复已下线酒店   | admin |

---

### 文件上传模块

| 接口     | 方法 | 路径           | 说明         | 权限           |
| -------- | ---- | -------------- | ------------ | -------------- |
| 单图上传 | POST | /upload/image  | 上传单张图片 | merchant/admin |
| 多图上传 | POST | /upload/images | 上传多张图片 | merchant/admin |

---

## 接口详细设计

### 一、认证接口（已实现）

详见 [API.md](./API.md)

---

### 二、酒店管理接口（商户端）

#### 1. 获取/初始化酒店

**接口地址**: `GET /hotels/my`

**权限**: merchant

**说明**: 获取当前商户的酒店信息。如果商户还没有酒店，则自动初始化一个空酒店（状态为draft）。

**请求头**:

```
Authorization: Bearer <token>
```

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "id": 1,
    "nameZh": "",
    "nameEn": "",
    "address": "",
    "starRating": 0,
    "roomTypes": [],
    "price": "0",
    "openDate": null,
    "nearbyAttractions": null,
    "nearbyTransport": null,
    "nearbyMalls": null,
    "discounts": null,
    "images": null,
    "description": null,
    "status": "draft",
    "rejectReason": null,
    "draftData": null,
    "creatorId": 15,
    "createdAt": "2026-02-12T06:00:00.000Z",
    "updatedAt": "2026-02-12T06:00:00.000Z"
  }
}
```

**字段说明**:

| 字段名    | 说明                                       |
| --------- | ------------------------------------------ |
| draftData | 草稿数据，已上线酒店修改后存储新数据的位置 |

---

#### 2. 更新酒店信息

**接口地址**: `PUT /hotels/my`

**权限**: merchant

**请求头**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:

| 参数名            | 类型   | 必填 | 说明                   |
| ----------------- | ------ | ---- | ---------------------- |
| nameZh            | string | 是   | 酒店中文名             |
| nameEn            | string | 是   | 酒店英文名             |
| address           | string | 是   | 酒店地址               |
| starRating        | number | 是   | 酒店星级（1-5）        |
| roomTypes         | array  | 是   | 房型信息               |
| openDate          | string | 是   | 开业时间（YYYY-MM-DD） |
| nearbyAttractions | string | 否   | 附近景点               |
| nearbyTransport   | string | 否   | 附近交通               |
| nearbyMalls       | string | 否   | 附近商场               |
| discounts         | array  | 否   | 优惠信息               |
| images            | array  | 否   | 酒店图片URL列表        |
| description       | string | 否   | 酒店描述               |

> **注意**: `price` 字段无需传入，系统会自动根据房型最低价格计算。

**请求示例**:

```json
{
  "nameZh": "杭州西湖希尔顿酒店",
  "nameEn": "Hilton Hangzhou West Lake",
  "address": "浙江省杭州市西湖区曙光路120号",
  "starRating": 5,
  "roomTypes": [
    {
      "name": "豪华大床房",
      "price": 688,
      "area": 35,
      "bedType": "大床",
      "facilities": ["WiFi", "空调", "电视", "独立卫浴", "迷你吧"]
    },
    {
      "name": "豪华双床房",
      "price": 728,
      "area": 38,
      "bedType": "双床",
      "facilities": ["WiFi", "空调", "电视", "独立卫浴", "迷你吧"]
    }
  ],
  "openDate": "2018-06-01",
  "nearbyAttractions": "西湖,灵隐寺,雷峰塔",
  "nearbyTransport": "地铁1号线龙翔桥站,公交K4路",
  "nearbyMalls": "银泰百货,湖滨银泰",
  "discounts": [
    {
      "type": "percentage",
      "name": "春节特惠",
      "value": 80,
      "description": "春节期间入住享8折优惠",
      "startDate": "2026-01-25",
      "endDate": "2026-02-10"
    }
  ],
  "images": ["https://example.com/hotel1.jpg", "https://example.com/hotel2.jpg"],
  "description": "杭州西湖希尔顿酒店坐落于风景秀丽的西湖畔..."
}
```

**业务规则**:

- 只能更新自己创建的酒店
- 允许更新的状态：`draft`、`rejected`、`published`、`offline`
- **版本控制机制**：
  - `draft`/`rejected` 状态：直接更新主数据
  - `published`/`offline` 状态：更新存入 `draftData` 字段，主数据不变

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "nameZh": "杭州西湖希尔顿酒店",
    "nameEn": "Hilton Hangzhou West Lake",
    "address": "浙江省杭州市西湖区曙光路120号",
    "starRating": 5,
    "roomTypes": [...],
    "price": "688",
    "openDate": "2018-06-01",
    "status": "draft",
    "draftData": null,
    "updatedAt": "2026-02-12T07:00:00.000Z"
  }
}
```

**已发布酒店更新响应**:

```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "nameZh": "杭州西湖希尔顿酒店（旧版）",
    "status": "published",
    "draftData": {
      "nameZh": "杭州西湖希尔顿酒店（新版）",
      "nameEn": "Hilton Hangzhou West Lake",
      "address": "浙江省杭州市西湖区曙光路120号",
      "starRating": 5,
      "roomTypes": [...],
      "price": 688,
      ...
    },
    "updatedAt": "2026-02-12T07:00:00.000Z"
  }
}
```

---

#### 3. 提交审核

**接口地址**: `PUT /hotels/my/submit`

**权限**: merchant

**请求头**:

```
Authorization: Bearer <token>
```

**业务规则**:

- 只能提交自己创建的酒店
- 允许提交的状态：`draft`、`rejected`、`published`、`offline`
- **版本控制机制**：
  - `published`/`offline` 状态：必须有 `draftData` 才能提交
  - 提交后状态变为 `pending`，但主数据不变
- 提交前会校验必须字段是否已填写

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "提交成功，等待审核",
  "data": {
    "id": 1,
    "status": "pending"
  }
}
```

**错误响应** (400):

```json
{
  "code": 400,
  "msg": "请先修改酒店信息后再提交审核",
  "data": null
}
```

---

#### 4. 取消提交

**接口地址**: `PUT /hotels/my/cancel`

**权限**: merchant

**请求头**:

```
Authorization: Bearer <token>
```

**业务规则**:

- 只能取消审核中状态的酒店
- 取消后状态变为草稿

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "取消提交成功",
  "data": {
    "id": 1,
    "status": "draft"
  }
}
```

**错误响应** (400):

```json
{
  "code": 400,
  "msg": "当前酒店状态为「草稿」，只能取消审核中状态的酒店",
  "data": null
}
```

---

### 三、酒店审核接口（管理员端）

#### 1. 获取酒店列表

**接口地址**: `GET /admin/hotels`

**权限**: admin

**请求头**:

```
Authorization: Bearer <token>
```

**查询参数**:

| 参数名     | 类型   | 必填 | 默认值 | 说明           |
| ---------- | ------ | ---- | ------ | -------------- |
| page       | number | 否   | 1      | 页码           |
| pageSize   | number | 否   | 10     | 每页数量       |
| status     | string | 否   | -      | 酒店状态筛选   |
| keyword    | string | 否   | -      | 酒店名称关键词 |
| starRating | number | 否   | -      | 星级筛选       |

**请求示例**:

```
GET /admin/hotels?page=1&pageSize=10&status=pending&starRating=5
```

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "nameZh": "杭州西湖希尔顿酒店",
        "nameEn": "Hilton Hangzhou West Lake",
        "address": "浙江省杭州市西湖区曙光路120号",
        "starRating": 5,
        "price": "688",
        "status": "pending",
        "image": "http://localhost:3000/uploads/hotel-xxx.jpg",
        "creatorId": 15,
        "creator": {
          "id": 15,
          "username": "merchant1"
        },
        "createdAt": "2026-02-11T06:00:00.000Z",
        "updatedAt": "2026-02-11T06:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

> **说明**: `image` 字段为酒店 `images` 数组的第一张图片URL，方便前端列表展示。如无图片则返回 `null`。

---

#### 2. 获取酒店详情

**接口地址**: `GET /admin/hotels/:id`

**权限**: admin

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 酒店ID |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "id": 1,
    "nameZh": "杭州西湖希尔顿酒店",
    "nameEn": "Hilton Hangzhou West Lake",
    "address": "浙江省杭州市西湖区曙光路120号",
    "starRating": 5,
    "roomTypes": [...],
    "price": "688",
    "openDate": "2018-06-01",
    "nearbyAttractions": "西湖,灵隐寺,雷峰塔",
    "nearbyTransport": "地铁1号线龙翔桥站,公交K4路",
    "nearbyMalls": "银泰百货,湖滨银泰",
    "discounts": [...],
    "images": [...],
    "description": "杭州西湖希尔顿酒店坐落于...",
    "status": "pending",
    "rejectReason": null,
    "draftData": null,
    "creator": {
      "id": 15,
      "username": "merchant1",
      "role": "merchant"
    },
    "createdAt": "2026-02-11T06:00:00.000Z",
    "updatedAt": "2026-02-11T06:00:00.000Z"
  }
}
```

---

#### 3. 审核通过

**接口地址**: `PUT /admin/hotels/:id/approve`

**权限**: admin

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 酒店ID |

**业务规则**:

- 只能审核审核中状态的酒店
- **版本控制机制**：
  - 如果有 `draftData`：将 `draftData` 合并到主数据，并清空 `draftData`
  - 如果没有 `draftData`：只更新状态

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "审核通过",
  "data": {
    "id": 1,
    "status": "approved",
    "draftData": null
  }
}
```

---

#### 4. 审核不通过

**接口地址**: `PUT /admin/hotels/:id/reject`

**权限**: admin

**请求头**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 酒店ID |

**请求参数**:

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| reason | string | 是   | 不通过原因 |

**请求示例**:

```json
{
  "reason": "酒店信息不完整，请补充房型图片"
}
```

**业务规则**:

- 只能审核审核中状态的酒店
- 审核不通过后，`draftData` 保留供商户再次修改

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "审核不通过",
  "data": {
    "id": 1,
    "status": "rejected",
    "rejectReason": "酒店信息不完整，请补充房型图片"
  }
}
```

---

#### 5. 发布酒店

**接口地址**: `PUT /admin/hotels/:id/publish`

**权限**: admin

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 酒店ID |

**业务规则**:

- 只能发布审核通过状态的酒店

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "发布成功",
  "data": {
    "id": 1,
    "status": "published"
  }
}
```

---

#### 6. 下线酒店

**接口地址**: `PUT /admin/hotels/:id/offline`

**权限**: admin

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 酒店ID |

**业务规则**:

- 只能下线已发布状态的酒店
- 下线不是删除，可以恢复
- 下线后仍可修改信息并提交审核

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "下线成功",
  "data": {
    "id": 1,
    "status": "offline"
  }
}
```

---

#### 7. 恢复上线

**接口地址**: `PUT /admin/hotels/:id/restore`

**权限**: admin

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 酒店ID |

**业务规则**:

- 只能恢复已下线状态的酒店

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "恢复成功",
  "data": {
    "id": 1,
    "status": "published"
  }
}
```

---

### 四、文件上传接口

#### 1. 单图上传

**接口地址**: `POST /upload/image`

**权限**: merchant/admin

**请求头**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明     |
| ------ | ---- | ---- | -------- |
| image  | file | 是   | 图片文件 |

**文件限制**:

- 支持格式: jpeg, jpg, png, gif, webp
- 最大大小: 5MB

**业务规则**:

- 商户上传时，酒店状态必须为：`draft`、`rejected`、`published`、`offline`

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "url": "/uploads/hotel-1234567890-123456789.jpg",
    "filename": "hotel-1234567890-123456789.jpg"
  }
}
```

---

#### 2. 多图上传

**接口地址**: `POST /upload/images`

**权限**: merchant/admin

**请求头**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名 | 类型   | 必填 | 说明                     |
| ------ | ------ | ---- | ------------------------ |
| images | file[] | 是   | 图片文件数组（最多10张） |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "上传成功",
  "data": [
    {
      "url": "/uploads/hotel-1234567890-123456789.jpg",
      "filename": "hotel-1234567890-123456789.jpg"
    },
    {
      "url": "/uploads/hotel-1234567891-987654321.jpg",
      "filename": "hotel-1234567891-987654321.jpg"
    }
  ]
}
```

---

## 错误码说明

| HTTP Code | Code | 说明                 |
| --------- | ---- | -------------------- |
| 200       | 200  | 操作成功             |
| 201       | 201  | 创建成功             |
| 400       | 400  | 请求参数错误         |
| 401       | 401  | 未授权               |
| 403       | 403  | 禁止访问（权限不足） |
| 404       | 404  | 资源不存在           |
| 409       | 409  | 资源冲突             |
| 500       | 500  | 内部服务器错误       |

### 业务错误码

| Code | 说明                               |
| ---- | ---------------------------------- |
| 1001 | 用户不存在                         |
| 1002 | 密码错误                           |
| 1003 | 用户已存在                         |
| 1004 | 角色无效                           |
| 1005 | 缺少必填字段                       |
| 1006 | 令牌已过期                         |
| 1007 | 令牌无效                           |
| 2001 | 酒店不存在                         |
| 2002 | 无权操作此酒店                     |
| 2003 | 酒店状态不允许此操作               |
| 2005 | 只能提交草稿或审核不通过状态的酒店 |
| 2006 | 只能审核审核中状态的酒店           |
| 2007 | 只能发布审核通过状态的酒店         |
| 2008 | 只能下线已发布状态的酒店           |
| 2009 | 只能恢复已下线状态的酒店           |
| 2010 | 文件上传失败                       |
| 2011 | 请先完善酒店必填信息               |

---

## 状态流转规则

### 商户操作

| 当前状态  | 操作     | 目标状态  | 说明                           |
| --------- | -------- | --------- | ------------------------------ |
| draft     | 更新信息 | draft     | 直接更新主数据                 |
| draft     | 提交审核 | pending   | -                              |
| rejected  | 更新信息 | draft     | 直接更新主数据                 |
| rejected  | 提交审核 | pending   | -                              |
| published | 更新信息 | published | 更新存入 draftData，主数据不变 |
| published | 提交审核 | pending   | 主数据不变，客户端仍展示原版本 |
| offline   | 更新信息 | offline   | 更新存入 draftData，主数据不变 |
| offline   | 提交审核 | pending   | 主数据不变                     |
| pending   | 取消提交 | draft     | -                              |

### 管理员操作

| 当前状态  | 操作       | 目标状态  | 说明                         |
| --------- | ---------- | --------- | ---------------------------- |
| pending   | 审核通过   | approved  | 如有 draftData，合并到主数据 |
| pending   | 审核不通过 | rejected  | draftData 保留供商户再次修改 |
| approved  | 发布       | published | -                            |
| published | 下线       | offline   | -                            |
| offline   | 恢复       | published | -                            |

---

## 版本控制机制

### 核心原理

已发布/已下线的酒店，在审核期间保持原版本数据，客户端仍可正常访问。新修改的数据存储在 `draftData` 字段中，审核通过后才合并到主数据。

### 数据存储规则

| 酒店状态          | 修改操作 | 数据存储位置   |
| ----------------- | -------- | -------------- |
| draft/rejected    | 直接更新 | 主数据字段     |
| published/offline | 更新草稿 | draftData 字段 |

### 驳回原因保留机制

驳回原因 `rejectReason` 会一直保留，直到下一次审核通过才会清除：

| 操作         | rejectReason 变化 |
| ------------ | ----------------- |
| 审核不通过   | 记录驳回原因      |
| 商户修改酒店 | 保留（不清除）    |
| 商户提交审核 | 保留（不清除）    |
| 审核通过     | 清除              |

> **说明**: 这样设计是为了让前端能随时展示最近一次的驳回原因，即使商户已修改并重新提交审核。

### 流程示例

```
已发布酒店
    │
    ├── 商户编辑 ──> 数据存入 draftData，主数据不变
    │
    ├── 商户提交审核 ──> 状态变为 pending
    │                      │
    │                      ├── 审核通过 ──> draftData 合并到主数据，draftData 清空，rejectReason 清空
    │                      │
    │                      └── 审核不通过 ──> 主数据不变，draftData 保留，rejectReason 记录
    │
    └── 客户端访问 ──> 始终展示主数据（原版本）
```

---

## 必填字段校验

提交审核时，以下字段必须填写：

| 字段名     | 说明                     |
| ---------- | ------------------------ |
| nameZh     | 酒店中文名               |
| nameEn     | 酒店英文名               |
| address    | 酒店地址                 |
| starRating | 酒店星级（1-5）          |
| roomTypes  | 房型信息（至少一个房型） |
| openDate   | 开业时间                 |

> **注意**: `price` 字段由系统自动计算，取房型中的最低价格。每个房型必须有有效的价格（> 0）。
