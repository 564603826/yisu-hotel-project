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

### 图片管理模块（商户端）

| 接口                 | 方法   | 路径                                         | 说明                     | 权限     |
| -------------------- | ------ | -------------------------------------------- | ------------------------ | -------- |
| 获取酒店图片         | GET    | /upload/hotels/:hotelId/images               | 获取酒店图片列表         | merchant |
| 上传酒店图片         | POST   | /upload/hotels/:hotelId/images               | 上传酒店图片             | merchant |
| 删除酒店图片         | DELETE | /upload/images/:id                           | 删除单张酒店图片         | merchant |
| 删除所有草稿图片     | DELETE | /upload/hotels/:hotelId/images               | 放弃草稿时删除所有草稿图 | merchant |
| 同步酒店图片         | POST   | /upload/hotels/:hotelId/images/sync          | 保存时同步图片到数据库   | merchant |
| 更新图片排序         | PUT    | /upload/images/sort                          | 更新图片排序             | merchant |
| 复制已发布图片为草稿 | POST   | /upload/hotels/:hotelId/images/copy-to-draft | 进入编辑时调用           | merchant |
| 发布图片             | POST   | /upload/hotels/:hotelId/images/publish       | 审核通过时调用           | merchant |

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

### Banner 管理模块（管理员端）

| 接口             | 方法 | 路径                          | 说明              | 权限  |
| ---------------- | ---- | ----------------------------- | ----------------- | ----- |
| 设为/取消 Banner | PUT  | /admin/hotels/:id/banner      | 设置酒店为 Banner | admin |
| 更新 Banner 信息 | PUT  | /admin/hotels/:id/banner-info | 更新 Banner 信息  | admin |
| 获取 Banner 列表 | GET  | /admin/banners                | 获取所有 Banner   | admin |

### Dashboard 模块（管理员端）

| 接口         | 方法 | 路径                   | 说明                    | 权限  |
| ------------ | ---- | ---------------------- | ----------------------- | ----- |
| 获取统计数据 | GET  | /admin/dashboard/stats | 获取 Dashboard 统计数据 | admin |

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
    "images": [],
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
| images    | 从 HotelImage 表获取的图片URL列表          |
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
| description       | string | 否   | 酒店描述               |

> **注意**: `price` 字段无需传入，系统会自动根据房型最低价格计算。图片通过图片管理接口操作，不在这里更新。

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
- **注意**: 提交前需要先调用 `/upload/hotels/:hotelId/images/publish` 接口发布图片

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

---

### 三、图片管理接口（商户端）

#### 1. 获取酒店图片

**接口地址**: `GET /upload/hotels/:hotelId/images`

**权限**: merchant

**请求头**:

```
Authorization: Bearer <token>
```

**查询参数**:

| 参数名   | 类型   | 必填 | 默认值     | 说明                                         |
| -------- | ------ | ---- | ---------- | -------------------------------------------- |
| status   | string | 否   | draft      | 图片状态: draft/published/archived           |
| type     | string | 否   | hotel_main | 图片类型: hotel_main/hotel_room/hotel_banner |
| roomType | string | 否   | -          | 房型ID（仅房型图片时使用）                   |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "hotelId": 1,
      "url": "/uploads/hotels/1/main/2026-02-17/1739788800000_abc123.webp",
      "type": "hotel_main",
      "roomType": null,
      "sortOrder": 0,
      "status": "draft",
      "version": 1,
      "filename": "hotel1.jpg",
      "fileSize": 1024000,
      "mimeType": "image/jpeg",
      "createdBy": 1,
      "updatedBy": 1,
      "createdAt": "2026-02-17T10:00:00.000Z",
      "updatedAt": "2026-02-17T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. 上传酒店图片

**接口地址**: `POST /upload/hotels/:hotelId/images`

**权限**: merchant

**请求头**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数** (Form Data):

| 参数名   | 类型   | 必填 | 默认值     | 说明                                         |
| -------- | ------ | ---- | ---------- | -------------------------------------------- |
| image    | file   | 是   | -          | 图片文件                                     |
| type     | string | 否   | hotel_main | 图片类型: hotel_main/hotel_room/hotel_banner |
| roomType | string | 否   | -          | 房型ID（仅房型图片时使用）                   |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "id": 1,
    "hotelId": 1,
    "url": "/uploads/hotels/1/main/2026-02-17/1739788800000_abc123.webp",
    "type": "hotel_main",
    "roomType": null,
    "sortOrder": 0,
    "status": "draft",
    "version": 1,
    "filename": "hotel1.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2026-02-17T10:00:00.000Z",
    "updatedAt": "2026-02-17T10:00:00.000Z"
  }
}
```

---

#### 3. 删除酒店图片

**接口地址**: `DELETE /upload/images/:id`

**权限**: merchant

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | number | 是   | 图片ID |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

---

#### 4. 更新图片排序

**接口地址**: `PUT /upload/images/sort`

**权限**: merchant

**请求头**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:

| 参数名   | 类型  | 必填 | 说明                   |
| -------- | ----- | ---- | ---------------------- |
| imageIds | array | 是   | 按排序顺序的图片ID数组 |

**请求示例**:

```json
{
  "imageIds": [3, 1, 2]
}
```

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

---

#### 5. 复制已发布图片为草稿

**接口地址**: `POST /upload/hotels/:hotelId/images/copy-to-draft`

**权限**: merchant

**说明**: 进入编辑页面时调用，将已发布图片复制为草稿图片。如果没有已发布图片，则返回空数组。

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名  | 类型   | 必填 | 说明   |
| ------- | ------ | ---- | ------ |
| hotelId | number | 是   | 酒店ID |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "url": "/uploads/hotels/1/main/2026-02-17/1739788800000_abc123.webp",
      "type": "hotel_main",
      "sortOrder": 0,
      "status": "draft",
      "version": 2
    }
  ]
}
```

---

#### 6. 发布图片

**接口地址**: `POST /upload/hotels/:hotelId/images/publish`

**权限**: merchant

**说明**: 提交审核时调用，将草稿图片标记为已发布，原已发布图片标记为已归档。

**请求头**:

```
Authorization: Bearer <token>
```

**路径参数**:

| 参数名  | 类型   | 必填 | 说明   |
| ------- | ------ | ---- | ------ |
| hotelId | number | 是   | 酒店ID |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

---

#### 7. 同步酒店图片

**接口地址**: `POST /upload/hotels/:hotelId/images/sync`

**权限**: merchant

**说明**: 保存酒店信息时调用，根据传入的图片列表同步数据库中的图片记录。会自动创建新图片记录、删除不存在的记录、更新排序。

**请求头**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:

| 参数名  | 类型   | 必填 | 说明   |
| ------- | ------ | ---- | ------ |
| hotelId | number | 是   | 酒店ID |

**请求参数**:

| 参数名   | 类型   | 必填 | 默认值     | 说明                                         |
| -------- | ------ | ---- | ---------- | -------------------------------------------- |
| images   | array  | 是   | -          | 图片URL列表（按排序顺序）                    |
| type     | string | 否   | hotel_main | 图片类型: hotel_main/hotel_room/hotel_banner |
| roomType | string | 否   | -          | 房型ID（仅房型图片时使用）                   |

**请求示例**:

```json
{
  "images": [
    "/uploads/temp/2026-02-17/1771355555396_eb531k.png",
    "/uploads/temp/2026-02-17/1771355555397_xyz789.png"
  ],
  "type": "hotel_main"
}
```

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

---

#### 8. 删除所有草稿图片

**接口地址**: `DELETE /upload/hotels/:hotelId/images`

**权限**: merchant

**说明**: 放弃草稿时调用，删除该酒店的所有草稿图片（包括物理文件）。

**请求头**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:

| 参数名  | 类型   | 必填 | 说明   |
| ------- | ------ | ---- | ------ |
| hotelId | number | 是   | 酒店ID |

**请求参数**:

| 参数名   | 类型   | 必填 | 默认值     | 说明                                         |
| -------- | ------ | ---- | ---------- | -------------------------------------------- |
| type     | string | 否   | hotel_main | 图片类型: hotel_main/hotel_room/hotel_banner |
| roomType | string | 否   | -          | 房型ID（仅房型图片时使用）                   |

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

---

### 四、酒店审核接口（管理员端）

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
        "images": ["/uploads/hotels/1/main/..."],
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

> **说明**: `image` 字段为酒店 `images` 数组的第一张图片URL，方便前端列表展示。`images` 从 HotelImage 表获取。

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
    "images": ["/uploads/hotels/1/main/..."],
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
  - **图片处理**：同时处理图片状态，将 draft 图片标记为 published，原 published 图片标记为 archived

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "审核通过",
  "data": {
    "id": 1,
    "status": "approved",
    "draftData": null,
    "images": ["/uploads/hotels/1/main/..."]
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
- **图片处理**：保留 draft 图片，商户可以继续编辑

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

### 五、Banner 管理接口（管理员端）

（略，保持原有文档）

---

## 图片管理设计说明

### 数据库设计

```prisma
model hotelimage {
  id        Int             @id @default(autoincrement())
  hotelId   Int
  url       String          @db.VarChar(500)
  type      hotelimage_type @default(hotel_main)
  roomType  String?         @db.VarChar(100)

  // 版本控制
  version   Int             @default(1)
  status    image_status    @default(draft)

  // 排序
  sortOrder Int             @default(0)

  // 元数据
  filename  String?         @db.VarChar(255)
  fileSize  Int?
  mimeType  String?         @db.VarChar(100)

  // 审计字段
  createdBy Int
  updatedBy Int
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  hotel     hotel           @relation(fields: [hotelId], references: [id], onDelete: Cascade, map: "HotelImage_hotelId_fkey")

  @@index([hotelId, type, status])
  @@index([hotelId, roomType, sortOrder])
  @@index([type, status])
}

enum image_status {
  draft
  published
  archived
}
```

### 图片状态说明

| 状态      | 说明                 |
| --------- | -------------------- |
| draft     | 草稿状态，编辑时使用 |
| published | 已发布状态，线上展示 |
| archived  | 已归档，保留历史版本 |

### 图片类型说明

| 类型         | 说明                        |
| ------------ | --------------------------- |
| hotel_main   | 酒店主图                    |
| hotel_room   | 房型图片（需配合 roomType） |
| hotel_banner | Banner图片                  |
| user_avatar  | 用户头像                    |

### 图片管理工作流

#### 1. 进入编辑

```
进入编辑页面
  ↓
调用 /copy-to-draft 接口
  ↓
将 published 图片复制为 draft（version + 1）
  ↓
编辑时操作 draft 状态图片
```

#### 2. 提交审核

```
点击提交审核
  ↓
先调用 /publish 接口处理图片
  ↓
将 draft 图片 → published
将原 published → archived
  ↓
再调用 /hotels/my/submit 接口
```

#### 3. 审核通过

```
管理员审核通过
  ↓
系统自动处理图片状态
  ↓
将 draft 图片 → published
将原 published → archived
  ↓
图片正式上线展示
```

#### 4. 审核驳回

```
管理员审核驳回
  ↓
保留 draft 图片
  ↓
商户可以继续编辑
  ↓
再次提交时重新发布
```

---

### 四、Dashboard 接口（管理员端）

#### 1. 获取统计数据

**接口地址**: `GET /admin/dashboard/stats`

**权限**: admin

**说明**: 获取 Dashboard 首页所需的统计数据，包括待审核数量、今日通过数量、平台收录总数。

**请求头**:

```
Authorization: Bearer <token>
```

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "获取统计数据成功",
  "data": {
    "pendingCount": 12,
    "todayApprovedCount": 5,
    "totalHotels": 1240,
    "lastUpdateTime": "2026-02-18T10:30:00.000Z"
  }
}
```

**字段说明**:

| 字段名             | 类型   | 说明                          |
| ------------------ | ------ | ----------------------------- |
| pendingCount       | number | 待审核酒店数量                |
| todayApprovedCount | number | 今日通过审核的酒店数量        |
| totalHotels        | number | 平台收录总数（已发布+已下线） |
| lastUpdateTime     | string | 最后更新时间（ISO 8601 格式） |

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
