# 移动端（用户端）接口设计文档

## 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: 无需认证，所有接口均为公开
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

**状态码说明：**

| 状态码 | 说明       |
| ------ | ---------- |
| 200    | 成功       |
| 400    | 请求错误   |
| 404    | 资源不存在 |
| 500    | 服务器错误 |

---

## 接口列表

| 接口           | 方法 | 路径                    | 说明                           |
| -------------- | ---- | ----------------------- | ------------------------------ |
| 获取Banner列表 | GET  | /mobile/banners         | 获取首页轮播图（从数据库读取） |
| 搜索酒店       | GET  | /mobile/hotels/search   | 关键字搜索酒店                 |
| 获取酒店列表   | GET  | /mobile/hotels          | 获取已发布酒店列表（支持筛选） |
| 获取酒店详情   | GET  | /mobile/hotels/:id      | 获取酒店详细信息               |
| 获取筛选选项   | GET  | /mobile/filters/options | 获取筛选条件选项               |
| 获取快捷标签   | GET  | /mobile/filters/tags    | 获取快捷标签列表               |

---

## 接口详细设计

### 一、Banner模块

#### 1. 获取Banner列表

**接口地址**: `GET /mobile/banners`

**说明**: 获取首页轮播的Banner列表。数据由PC端管理员后台配置，从数据库读取已发布且设为Banner的酒店。

**数据规则**:

- 只返回已发布状态的酒店
- 按 `bannerSort` 字段升序排列
- 最多返回5个Banner
- 图片使用酒店的第一张图片

**请求参数**: 无

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "banners": [
      {
        "id": 1,
        "title": "杭州西湖希尔顿 - 限时特惠",
        "subtitle": "春节特惠 8折起，立即预订",
        "imageUrl": "https://example.com/hotel1.jpg",
        "hotelId": 1
      },
      {
        "id": 2,
        "title": "外滩华尔道夫",
        "subtitle": "奢华体验，尽享黄浦江景",
        "imageUrl": "https://example.com/hotel2.jpg",
        "hotelId": 2
      }
    ]
  }
}
```

**字段说明：**

| 字段名   | 类型   | 说明                            |
| -------- | ------ | ------------------------------- |
| id       | number | Banner ID（即酒店ID）           |
| title    | string | Banner标题（管理员自定义）      |
| subtitle | string | 副标题/描述（管理员自定义）     |
| imageUrl | string | 酒店封面图URL（酒店第一张图片） |
| hotelId  | number | 关联酒店ID，点击跳转酒店详情页  |

**数据来源**：

- `title`: 管理员在后台设置的 `bannerTitle`，默认使用酒店名称
- `subtitle`: 管理员在后台设置的 `bannerDesc`
- `imageUrl`: 从 `HotelImage` 表获取的酒店主图（type='hotel_main'，status='published'）
- 只有 `isBanner=true` 且 `status='published'` 的酒店才会返回

---

### 二、酒店搜索模块

#### 1. 搜索酒店（关键字搜索）

**接口地址**: `GET /mobile/hotels/search`

**说明**: 根据关键字搜索已发布的酒店，支持酒店名、地址模糊搜索。

**请求参数**:

| 参数名  | 类型   | 必填 | 说明             |
| ------- | ------ | ---- | ---------------- |
| keyword | string | 是   | 搜索关键字       |
| page    | number | 否   | 页码，默认1      |
| limit   | number | 否   | 每页数量，默认10 |

**请求示例**:

```
GET /mobile/hotels/search?keyword=杭州&page=1&limit=10
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
        "price": 688,
        "mainImage": "https://example.com/hotel1.jpg",
        "tags": ["豪华", "湖景", "免费停车"]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

#### 2. 获取酒店列表（支持筛选）

**接口地址**: `GET /mobile/hotels`

**说明**: 获取状态为 `published`（已发布）的酒店列表，支持多种筛选条件和排序。

**请求参数**:

| 参数名            | 类型   | 必填 | 说明                                                |
| ----------------- | ------ | ---- | --------------------------------------------------- |
| city              | string | 否   | 城市/地址（支持模糊匹配，如"深圳市南山区"）         |
| starRating        | string | 否   | 星级筛选：1-5，多个用逗号分隔，如"4,5"              |
| minPrice          | number | 否   | 最低价格                                            |
| maxPrice          | number | 否   | 最高价格                                            |
| tags              | string | 否   | 快捷标签，多个用逗号分隔，如"亲子,豪华"             |
| facilities        | string | 否   | 设施筛选，多个用逗号分隔，如"免费WiFi,游泳池"       |
| roomTypes         | string | 否   | 房型筛选，多个用逗号分隔，如"大床房,套房"           |
| nearbyAttractions | string | 否   | 周边景点筛选，多个用逗号分隔，如"世界之窗,欢乐谷"   |
| nearbyTransport   | string | 否   | 交通信息筛选，多个用逗号分隔，如"地铁站,机场"       |
| nearbyMalls       | string | 否   | 商圈筛选，多个用逗号分隔，如"万象城,海岸城"         |
| sortBy            | string | 否   | 排序方式：default, price-asc, price-desc, star-desc |
| page              | number | 否   | 页码，默认1                                         |
| limit             | number | 否   | 每页数量，默认10                                    |

**排序方式说明**:

| 值         | 说明             |
| ---------- | ---------------- |
| default    | 综合推荐（默认） |
| price-asc  | 价格从低到高     |
| price-desc | 价格从高到低     |
| star-desc  | 星级从高到低     |

**请求示例**:

```
GET /mobile/hotels?city=杭州&starRating=4,5&minPrice=500&maxPrice=1000&sortBy=price-asc&page=1&limit=10
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
        "price": 688,
        "originalPrice": 888,
        "discountInfo": {
          "type": "percentage",
          "name": "春节特惠",
          "value": 80
        },
        "mainImage": "https://example.com/hotel1.jpg",
        "images": ["https://example.com/hotel1-1.jpg", "https://example.com/hotel1-2.jpg"],
        "tags": ["豪华", "湖景", "免费停车"],
        "facilities": ["WiFi", "游泳池", "健身房"]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

**字段说明：**

| 字段名        | 类型   | 说明                                   |
| ------------- | ------ | -------------------------------------- |
| id            | number | 酒店ID                                 |
| nameZh        | string | 酒店中文名                             |
| nameEn        | string | 酒店英文名                             |
| address       | string | 酒店地址                               |
| starRating    | number | 酒店星级（1-5）                        |
| price         | number | 当前最低价格（根据房型计算）           |
| originalPrice | number | 原价（有优惠时）                       |
| discountInfo  | object | 优惠信息（仅返回type/name/value）      |
| mainImage     | string | 主图URL（images的第一张）              |
| images        | array  | 图片列表                               |
| tags          | array  | 标签列表（根据星级/景点/设施自动生成） |
| facilities    | array  | 设施列表（从所有房型聚合）             |

---

#### 3. 获取酒店详情

**接口地址**: `GET /mobile/hotels/:id`

**说明**: 获取酒店详细信息，仅返回 `status` 为 `published` 的酒店。

**请求参数**:

| 参数名 | 类型   | 必填 | 说明               |
| ------ | ------ | ---- | ------------------ |
| id     | number | 是   | 酒店ID（路径参数） |

**请求示例**:

```
GET /mobile/hotels/1
```

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
    "openDate": "2018-06-01",
    "description": "杭州西湖希尔顿酒店坐落于风景秀丽的西湖畔...",
    "price": 688,
    "originalPrice": 888,
    "discountInfo": {
      "type": "percentage",
      "name": "春节特惠",
      "value": 80,
      "description": "春节期间入住享8折优惠"
    },
    "images": [
      "https://example.com/hotel1-1.jpg",
      "https://example.com/hotel1-2.jpg",
      "https://example.com/hotel1-3.jpg"
    ],
    "facilities": ["WiFi", "空调", "电视", "游泳池", "健身房", "免费停车", "餐厅"],
    "tags": ["豪华", "湖景", "亲子", "商务"],
    "nearby": {
      "attractions": [
        { "name": "克拉码头", "distance": "直线距离540米" },
        { "name": "滨海湾", "distance": "直线距离2.3公里" }
      ],
      "transport": [
        { "name": "牛车水地铁站", "distance": "步行距离340米,约6分钟" },
        { "name": "克拉码头地铁站", "distance": "步行距离380米,约6分钟" }
      ],
      "malls": [{ "name": "万达广场", "distance": "步行5分钟" }]
    },
    "roomTypes": [
      {
        "name": "豪华大床房",
        "price": 688,
        "originalPrice": 888,
        "area": 35,
        "bedType": "大床",
        "facilities": ["WiFi", "空调", "电视", "独立卫浴", "迷你吧"],
        "images": ["https://example.com/room1-1.jpg"],
        "breakfast": false
      },
      {
        "name": "豪华双床房",
        "price": 728,
        "originalPrice": 928,
        "area": 38,
        "bedType": "双床",
        "facilities": ["WiFi", "空调", "电视", "独立卫浴", "迷你吧"],
        "images": ["https://example.com/room2-1.jpg"],
        "breakfast": false
      }
    ]
  }
}
```

**字段说明：**

**酒店基本信息**

| 字段名        | 类型   | 说明                   |
| ------------- | ------ | ---------------------- |
| id            | number | 酒店ID                 |
| nameZh        | string | 酒店中文名             |
| nameEn        | string | 酒店英文名             |
| address       | string | 酒店地址               |
| starRating    | number | 酒店星级               |
| openDate      | string | 开业时间               |
| description   | string | 酒店描述               |
| price         | number | 最低价格（房型最低价） |
| originalPrice | number | 原价                   |
| discountInfo  | object | 优惠信息               |
| images        | array  | 酒店图片列表           |
| facilities    | array  | 设施列表               |
| tags          | array  | 标签列表               |

**周边信息 (nearby)**

| 字段名      | 类型  | 说明                           |
| ----------- | ----- | ------------------------------ |
| attractions | array | 附近景点列表（包含名称和距离） |
| transport   | array | 附近交通列表（包含名称和距离） |
| malls       | array | 附近商场列表（包含名称和距离） |

**周边列表项结构**

| 字段名   | 类型   | 说明                          |
| -------- | ------ | ----------------------------- |
| name     | string | 地点名称（如：克拉码头）      |
| distance | string | 距离信息（如：直线距离540米） |

**房型信息 (roomTypes)** - 按价格从低到高排序

| 字段名        | 类型    | 说明                    |
| ------------- | ------- | ----------------------- |
| name          | string  | 房型名称                |
| price         | number  | 价格                    |
| originalPrice | number  | 原价（有优惠时）        |
| area          | number  | 面积（平方米）          |
| bedType       | string  | 床型                    |
| facilities    | array   | 房间设施                |
| images        | array   | 房型图片                |
| breakfast     | boolean | 是否含早餐（默认false） |

---

### 三、筛选配置模块

#### 1. 获取筛选选项

**接口地址**: `GET /mobile/filters/options`

**说明**: 获取酒店筛选条件选项，用于筛选区域展示。

**请求参数**: 无

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "starRatings": [
      { "value": 5, "label": "五星级" },
      { "value": 4, "label": "四星级" },
      { "value": 3, "label": "三星级" },
      { "value": 2, "label": "二星级" },
      { "value": 1, "label": "一星级" }
    ],
    "priceRanges": [
      { "min": 0, "max": 200, "label": "¥200以下" },
      { "min": 200, "max": 500, "label": "¥200-500" },
      { "min": 500, "max": 1000, "label": "¥500-1000" },
      { "min": 1000, "max": 2000, "label": "¥1000-2000" },
      { "min": 2000, "max": null, "label": "¥2000以上" }
    ],
    "sortOptions": [
      { "value": "default", "label": "综合推荐" },
      { "value": "price-asc", "label": "价格从低到高" },
      { "value": "price-desc", "label": "价格从高到低" },
      { "value": "star-desc", "label": "星级从高到低" }
    ],
    "facilities": [
      { "value": "免费WiFi", "label": "免费WiFi" },
      { "value": "游泳池", "label": "游泳池" },
      { "value": "健身房", "label": "健身房" },
      { "value": "免费停车", "label": "免费停车" },
      { "value": "餐厅", "label": "餐厅" }
    ],
    "roomTypes": [
      { "value": "大床房", "label": "大床房" },
      { "value": "双床房", "label": "双床房" },
      { "value": "套房", "label": "套房" },
      { "value": "家庭房", "label": "家庭房" }
    ],
    "nearbyAttractions": [
      { "value": "世界之窗", "label": "世界之窗" },
      { "value": "欢乐谷", "label": "欢乐谷" },
      { "value": "西湖", "label": "西湖" }
    ],
    "nearbyTransport": [
      { "value": "地铁站", "label": "地铁站" },
      { "value": "机场", "label": "机场" },
      { "value": "火车站", "label": "火车站" }
    ],
    "nearbyMalls": [
      { "value": "万象城", "label": "万象城" },
      { "value": "海岸城", "label": "海岸城" },
      { "value": "万达广场", "label": "万达广场" }
    ]
  }
}
```

**字段说明：**

| 字段名            | 类型  | 说明                                           |
| ----------------- | ----- | ---------------------------------------------- |
| starRatings       | array | 星级选项（固定配置）                           |
| priceRanges       | array | 价格区间选项（固定配置）                       |
| sortOptions       | array | 排序方式选项（固定配置）                       |
| facilities        | array | 设施选项（从数据库动态获取，根据实际酒店数据） |
| roomTypes         | array | 房型选项（从数据库动态获取，根据实际酒店数据） |
| nearbyAttractions | array | 周边景点选项（从数据库动态获取）               |
| nearbyTransport   | array | 交通信息选项（从数据库动态获取）               |
| nearbyMalls       | array | 商圈选项（从数据库动态获取）                   |

**注意**：`facilities`、`roomTypes`、`nearbyAttractions`、`nearbyTransport`、`nearbyMalls` 为动态数据，根据当前已发布酒店的实际数据生成，确保前端展示的选项都能查到结果。

---

#### 2. 获取快捷标签

**接口地址**: `GET /mobile/filters/tags`

**说明**: 获取快捷标签列表，用于首页快捷筛选。

**请求参数**: 无

**成功响应** (200):

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "tags": [
      { "id": 1, "name": "亲子", "icon": "baby" },
      { "id": 2, "name": "豪华", "icon": "crown" },
      { "id": 3, "name": "湖景", "icon": "waves" },
      { "id": 4, "name": "山景", "icon": "mountain" },
      { "id": 5, "name": "免费停车", "icon": "car" },
      { "id": 6, "name": "商务", "icon": "briefcase" },
      { "id": 7, "name": "度假", "icon": "umbrella" },
      { "id": 8, "name": "网红", "icon": "camera" }
    ]
  }
}
```

---

## 数据来源说明

### 1. 酒店列表/详情数据来源

所有移动端酒店数据均来自 PC 端商户发布的酒店信息：

- **数据来源表**: `Hotel` 表 + `HotelImage` 表
- **筛选条件**: `status = 'published'`（仅展示已发布酒店）
- **价格计算**: 取 `roomTypes` 中最低价格
- **图片**: 从 `HotelImage` 表获取，筛选 `status = 'published'` 的图片
  - 酒店主图: `type = 'hotel_main'`
  - 房型图片: `type = 'hotel_room'` 且 `roomType = 房型名`
- **标签**: 根据以下规则自动生成
  - 五星级 → "顶级"
  - 四星级 → "豪华"
  - 有附近景点 → "景点"
  - 设施包含"免费停车" → "免费停车"
  - 设施包含"游泳池" → "度假"
  - 设施包含"健身房" → "商务"
- **设施**: 从所有房型的 `facilities` 字段聚合，自动去重

### 2. Banner 数据来源

从数据库读取已发布且设为 Banner 的酒店：

- **数据来源表**: `Hotel` 表 + `HotelImage` 表
- **筛选条件**: `isBanner = true` 且 `status = 'published'`
- **排序**: 按 `bannerSort` 升序
- **数量限制**: 最多 5 个
- **图片**: 从 `HotelImage` 表获取酒店主图

### 3. 筛选选项数据来源

- **星级**: 固定选项（1-5星）
- **价格区间**: 固定区间配置
- **排序**: 固定排序选项（default, price-asc, price-desc, star-desc）
- **快捷标签**: 固定标签列表（可从配置文件读取）
- **设施**: 从所有已发布酒店的 `facilities` 字段聚合，自动去重
- **房型**: 从所有已发布酒店的 `roomTypes` 字段提取房型名称，自动去重
- **周边景点**: 从所有已发布酒店的 `nearbyAttractions` 字段解析，自动去重
- **交通信息**: 从所有已发布酒店的 `nearbyTransport` 字段解析，自动去重
- **商圈**: 从所有已发布酒店的 `nearbyMalls` 字段解析，自动去重

---

## 图片管理说明

### 图片状态

| 状态      | 说明                 |
| --------- | -------------------- |
| draft     | 草稿状态，编辑时使用 |
| published | 已发布状态，线上展示 |
| archived  | 已归档，保留历史版本 |

### 移动端图片获取规则

- 移动端只展示 `status = 'published'` 的图片
- 图片按 `sortOrder` 升序排列
- 酒店主图: `type = 'hotel_main'`
- 房型图片: `type = 'hotel_room'` 且 `roomType = 房型名`

---

## 接口实现要点

### 1. 酒店列表查询

- 必须筛选 `status = 'published'`
- 支持分页（page/limit）
- 支持多条件组合筛选
- 房型价格从低到高排序

### 2. 酒店详情查询

- 必须验证 `status = 'published'`，否则返回 404
- 房型按价格从低到高排序
- 返回完整的酒店信息（包含周边、房型等）

### 3. 搜索功能

- 支持酒店名模糊搜索
- 支持地址模糊搜索
- 仅搜索已发布酒店

---

## 后续扩展建议

1. **Banner 管理**: PC 管理员后台添加 Banner 配置功能
2. **标签管理**: 将标签配置化，支持后台管理
3. **缓存优化**: 酒店列表和详情添加 Redis 缓存
4. **搜索优化**: 使用 Elasticsearch 实现全文搜索
