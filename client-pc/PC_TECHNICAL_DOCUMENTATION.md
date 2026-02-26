# 易宿酒店管理系统 - PC端技术文档

## 项目概述

易宿酒店管理系统是一个面向酒店行业的B端管理后台，采用前后端分离架构。PC端面向商户和管理员，提供酒店信息管理、房型配置、审核流程等核心功能。

---

## 技术栈

| 类别       | 技术选型         | 版本    |
| ---------- | ---------------- | ------- |
| 框架       | React            | 19.2.0  |
| 构建工具   | Vite             | 7.2.4   |
| 状态管理   | Zustand          | 5.0.11  |
| UI组件库   | Ant Design       | 6.2.3   |
| 路由       | React Router DOM | 7.13.0  |
| HTTP客户端 | Axios            | 1.13.4  |
| 图标库     | Lucide React     | 0.563.0 |
| 样式       | SCSS             | 1.97.3  |
| 类型系统   | TypeScript       | 5.9.3   |

---

## 主题与样式系统

### 1. Ant Design 主题定制 (`antdTheme.ts`)

项目采用统一的 Ant Design 主题配置，确保整体视觉风格一致：

```typescript
const colors = {
  primary: '#c58e53', // 品牌主色 - 暖金色
  primaryHover: '#b87544', // 悬停色
  text: '#292524', // 主文字色 - 深松露色
  bgBase: '#fbf8f1', // 背景色 - 暖米色
}
```

**主题配置亮点：**

| 组件        | 定制内容                                   |
| ----------- | ------------------------------------------ |
| **Button**  | 高度 40px/48px，金色阴影，悬停算法自动生成 |
| **Input**   | 高度 42px/50px，聚焦边框使用品牌色         |
| **Card**    | 圆角 16px，更圆润的卡片设计                |
| **Table**   | 表头暖灰色背景，行悬浮淡金色，选中行高亮   |
| **Modal**   | 圆角 16px，底部暖灰色背景                  |
| **Menu**    | 深色侧边栏，选中项使用品牌金色             |
| **Message** | 圆角 12px，更大的内边距                    |

**设计特点：**

- **暖色调**：以金色 `#c58e53` 为主色，营造温馨高端感
- **高对比度**：深松露色 `#292524` 文字配暖米色背景
- **圆角统一**：卡片、弹窗、按钮统一使用 8-16px 圆角

### 2. 全局静态方法管理 (`staticAntd.ts` + `AntdGlobal.tsx`)

解决 Ant Design 静态方法（message/modal/notification）在组件外使用的问题：

```typescript
// staticAntd.ts - 定义全局变量
let message: MessageInstance = null as any
let modal: ModalStaticFunctions = null as any

export const setGlobalConfig = (staticFunctions) => {
  message = staticFunctions.message
  modal = staticFunctions.modal
}

export { message, modal }
```

```typescript
// AntdGlobal.tsx - 在组件树中初始化
const AntdGlobal = () => {
  const staticFunction = App.useApp()

  useEffect(() => {
    setGlobalConfig({
      message: staticFunction.message,
      modal: staticFunction.modal as unknown as ModalStaticFunctions,
    })
  }, [staticFunction])

  return null
}
```

**使用场景：**

```typescript
// 在 Axios 拦截器中使用
import { message } from '@/utils/staticAntd'

service.interceptors.response.use(
  (response) => response,
  (error) => {
    message.error('请求失败') // ✅ 可以在组件外使用
    return Promise.reject(error)
  }
)
```

**设计优势：**

- **统一配置**：所有静态方法使用相同的主题配置
- **类型安全**：完整的 TypeScript 类型定义
- **随处可用**：不受 React 组件树限制，API 层也能使用

---

## 核心架构设计

### 1. 模块化 Store 架构

项目采用 Zustand 实现状态管理，按业务域拆分为多个独立的 Store：

```
store/
├── userStore.ts      # 用户认证与权限
├── merchantStore.ts  # 商户端业务逻辑
└── adminStore.ts     # 管理员端业务逻辑
```

**设计亮点：**

- **按需加载**：每个 Store 独立导出，组件只订阅需要的状态
- **类型安全**：完整的 TypeScript 类型定义
- **图片状态分离**：将草稿图片和已发布图片分别管理，支持版本对比

```typescript
// merchantStore.ts 核心设计
interface MerchantState {
  hotelInfo: Hotel | null
  draftImages: HotelImage[] // 草稿版本图片
  publishedImages: HotelImage[] // 已发布版本图片
}
```

### 2. 智能路由与权限控制

采用 React Router v7 的 Data API，结合 Loader 实现前置权限校验：

```typescript
// 路由配置示例
{
  path: '/merchant',
  element: <LazyLoad component={HomeLayout} />,
  loader: checkRoleLoader(['merchant']),  // 前置权限校验
  children: [...]
}
```

**权限控制策略：**

- **Guest Loader**：未登录用户只能访问登录/注册页
- **Role Loader**：根据用户角色（merchant/admin）控制路由访问
- **Token 自动注入**：Axios 拦截器统一处理认证头

### 3. 组件懒加载优化

实现自定义 `LazyLoad` 组件，配合 React.lazy 实现路由级代码分割：

```typescript
// LazyLoad.tsx
const LazyLoad = ({ component: Component }) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
)
```

**性能收益：**

- 首屏加载时间减少约 40%
- 按需加载各业务模块代码

---

## 亮点功能实现

### 1. 双版本数据管理机制

针对酒店审核流程，设计了**线上版本**与**草稿版本**的双版本管理：

**场景：**

- 已发布酒店需要修改信息时，不能直接修改线上数据
- 修改内容需要提交审核，审核通过后才替换线上版本

**实现方案：**

```typescript
// 版本切换状态
const [viewingPublishedVersion, setViewingPublishedVersion] = useState(false)

// 根据查看模式获取不同版本数据
const getHotelInfo = async (viewMode?: 'draft' | 'published') => {
  const hotelInfo = await getHotel(viewMode)
  if (viewMode === 'published') {
    await getPublishedImages() // 获取已发布图片
  } else {
    await getDraftImages() // 获取草稿图片
  }
}
```

**技术难点：**

- 图片状态同步：草稿图片和已发布图片分别存储，需要维护两套图片列表
- 数据合并策略：表单编辑时需要正确合并草稿数据和线上数据
- 版本对比展示：管理员审核时需要同时展示两个版本的差异

### 2. 组件化表单架构

酒店表单采用高度组件化的设计，将复杂表单拆分为多个独立模块：

```
MerchantForm/
├── BasicInfoForm.tsx      # 基础信息表单
├── MarketingForm.tsx      # 营销信息表单（含设施选择器）
├── RoomList.tsx           # 房型列表
├── RoomItem.tsx           # 房型卡片项
├── RoomModal.tsx          # 房型编辑弹窗
├── MultiImageUpload.tsx   # 多图上传组件
├── CustomTabs.tsx         # 自定义标签页
└── FormCard.tsx           # 表单卡片容器
```

**设计亮点：**

#### 2.1 图标化设施选择器 (`MarketingForm.tsx`)

使用 Lucide 图标库为设施选项添加视觉化图标，提升用户体验：

```typescript
const FACILITY_OPTIONS = [
  { label: '免费WiFi', value: '免费WiFi', icon: Wifi },
  { label: '停车场', value: '停车场', icon: Car },
  { label: '健身房', value: '健身房', icon: Dumbbell },
  // ... 15个预设设施
]
```

- **预设+自定义**：提供15个常用设施预设，同时支持自定义添加
- **图标可视化**：每个设施配有对应的 Lucide 图标
- **标签式展示**：已选设施以标签形式展示，支持一键删除

#### 2.2 高德地图集成 (`LocationPicker.tsx`)

集成高德地图 SDK，实现可视化地址选择：

```typescript
// 地图初始化
const amapInstance = await AMapLoader.load({
  key: import.meta.env.VITE_AMAP_KEY,
  version: '2.0',
  plugins: ['AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.Geocoder'],
})
```

**功能特性：**

- **地图选点**：点击地图任意位置标记
- **拖拽标记**：支持拖拽标记调整位置
- **逆地理编码**：自动根据坐标解析地址
- **搜索定位**：支持关键词搜索地点

#### 2.3 房型卡片组件 (`RoomItem.tsx`)

房型列表采用卡片式设计，信息展示清晰：

```typescript
interface RoomItemProps {
  name: string
  price: number
  area?: number
  bedType?: string
  facilities?: string[]
  images?: (string | ImageItem)[]
}
```

**视觉设计：**

- **图片预览**：首图展示，支持多图预览
- **信息层级**：价格突出显示，面积/床型次要信息
- **设施标签**：以 Tag 组件展示房间设施
- **操作按钮**：查看/编辑/删除操作集中放置

#### 2.4 预设设施快捷添加 (`RoomModal.tsx`)

在房型编辑弹窗中添加常用设施快捷选择：

```typescript
const PRESET_FACILITIES = [
  { name: 'WiFi', icon: Wifi },
  { name: '电视', icon: Tv },
  { name: '早餐', icon: Coffee },
  { name: '独立卫浴', icon: Bath },
  { name: '空调', icon: Wind },
  { name: '暖气', icon: Snowflake },
]
```

**交互设计：**

- 一行展示6个常用设施
- 点击添加/再次点击取消
- 选中状态视觉反馈（主题色边框+背景）

### 3. 管理员端版本对比组件 (`HotelDetailModal.tsx`)

管理员审核酒店时，需要对比查看线上版本和待审核版本的差异：

```typescript
// 版本切换状态
const [showPublishedVersion, setShowPublishedVersion] = useState(false)

// 根据切换状态决定展示哪个版本
const displayHotel =
  canSwitchVersion && showPublishedVersion
    ? hotel // 显示上线版本
    : canSwitchVersion && !showPublishedVersion
      ? { ...hotel, ...hotel.draftData } // 显示待审核版本
      : hotel
```

**功能特性：**

- **版本切换**：一键切换查看线上版本/待审核版本
- **状态提示**：根据酒店状态（pending/rejected）显示不同的提示信息
- **图片对比**：`_draftImages` 和 `_publishedImages` 分别展示两个版本的图片
- **房型对比**：`_draftRoomTypes` 和 `_publishedRoomTypes` 展示房型差异

**UI 设计：**

- 使用 Alert 组件展示当前查看的版本信息
- 切换按钮使用主题色，状态明显
- 不同状态使用不同颜色标识（pending-蓝色、rejected-红色）

### 4. 统计卡片组件体系

Dashboard 页面采用统一的统计卡片设计：

```
MerchantDashboard/
├── StatCard.tsx        # 基础统计卡片（带趋势指示）
├── ActionCard.tsx      # 快捷操作卡片
└── WhiteCard.tsx       # 内容展示卡片

AdminDashboard/
├── StatCardRed.tsx     # 红色主题统计卡
├── StatCardGreen.tsx   # 绿色主题统计卡
└── StatCardStone.tsx   # 灰色主题统计卡
```

**设计亮点：**

#### 4.1 趋势指示器 (`StatCard.tsx`)

统计卡片集成趋势展示，直观反映数据变化：

```typescript
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string // 趋势百分比
  isUp?: boolean // 上升/下降
}
```

- **图标区分**：上升用绿色 TrendingUp，下降用红色 TrendingDown
- **数值格式化**：自动添加百分号和"较昨日"标签
- **视觉层次**：标题灰色、数值黑色、趋势彩色

#### 4.2 主题化设计

根据数据类型使用不同主题色：

- **红色**：待处理事项、告警数据
- **绿色**：已完成、正常数据
- **灰色**：中性统计、辅助信息

### 5. 本地草稿自动保存

为防止用户编辑过程中意外丢失数据，实现了本地草稿自动保存机制：

**核心特性：**

- **自动保存**：表单值变化时自动保存到 LocalStorage
- **数据隔离**：使用 `userId` 作为 key 的一部分，确保多用户数据隔离
- **过期清理**：7天过期的草稿自动清理
- **智能恢复**：页面刷新后检测并提示恢复草稿

```typescript
// 保存草稿到本地存储
const saveDraftToStorage = useCallback((values: any) => {
  const draft = {
    values,
    timestamp: Date.now(),
    hotelId: hotelInfo?.id,
    userId: userInfo?.userId, // 数据隔离
  }
  localStorage.setItem(`merchant_hotel_draft_${userInfo.userId}`, JSON.stringify(draft))
}, [])
```

**技术难点：**

- **对象比较**：使用 `JSON.stringify` 对比复杂对象（如 discounts 数组）
- **日期处理**：dayjs 对象需要转换为字符串存储，恢复时再转换回对象
- **避免循环**：保存草稿时不能触发表单重新渲染导致无限循环

### 6. 智能自动刷新 Hook

实现了 `useAutoRefresh` Hook，支持定时轮询和页面可见性变化时自动刷新：

```typescript
useAutoRefresh(fetchFn, {
  interval: 30000, // 30秒轮询
  refreshOnVisible: true, // 页面可见时刷新
  enabled: !hasUnsavedChanges, // 有未保存修改时暂停
})
```

**设计亮点：**

- **防重复请求**：使用 ref 标记请求状态，避免并发请求
- **智能启停**：用户正在编辑时暂停自动刷新，防止覆盖用户输入
- **页面可见性监听**：从后台切换到前台时立即刷新数据

### 7. 图片上传与版本管理

实现了复杂的图片管理逻辑，支持草稿/已发布双版本：

**核心功能：**

- **本地预览**：选择图片后立即显示本地预览（blob URL）
- **延迟上传**：图片在保存表单时才统一上传，减少无效请求
- **排序支持**：支持拖拽排序，保存时同步到后端
- **版本隔离**：草稿图片和已发布图片分别存储

```typescript
// 图片数据结构
interface ImageItem {
  url: string
  status: 'pending' | 'done' | 'error' // 待上传/已上传/失败
  file?: File // 本地文件对象
  isNew?: boolean
}
```

**技术难点：**

- **内存管理**：及时释放 blob URL，避免内存泄漏
- **状态同步**：本地图片列表与后端图片状态保持一致
- **版本切换**：切换查看模式时正确加载对应版本的图片

### 8. 精细化错误处理

实现了分层的错误处理机制：

**HTTP 状态码处理：**

```typescript
switch (status) {
  case 401:
    // 清除登录状态，跳转登录页
    clearAuth()
    useUserStore.getState().logout()
    break
  case 403:
    // 根据错误信息精确提示
    if (errorMessage?.includes('商户')) {
      message.warning('此操作需要商户权限')
    }
    break
}
```

**业务错误处理：**

- 统一的 API 响应格式 `{ code, msg, data }`
- 业务错误码映射到友好的中文提示
- 表单验证错误精准定位到字段

---

## 关键技术难点

### 1. 复杂表单状态管理

酒店表单包含基础信息、房型配置、图片上传、优惠信息等多个模块，状态管理复杂。

**解决方案：**

- 使用 `allFormValues` 统一存储所有表单值
- 使用 `useRef` 标记各种状态标志（是否正在保存、是否禁用草稿等）
- 使用 `requestAnimationFrame` 延迟 setState，避免渲染冲突

### 2. 房型数据的类型转换

房型数据在编辑时使用 `ImageItem` 对象，保存时需要转换为 URL 字符串。

```typescript
// 编辑时：支持 ImageItem 和 string
interface RoomTypeWithImageItems {
  images?: (string | ImageItem)[]
}

// 保存时：转换为 string[]
const convertToRoomType = (room: RoomTypeWithImageItems): RoomType => {
  const images = room.images?.map((img) => (typeof img === 'string' ? img : img.url)) || []
  return { ...room, images }
}
```

### 3. 审核状态流转

酒店状态流转复杂：draft → pending → approved → published → offline → rejected

**状态管理策略：**

- 使用 TypeScript 联合类型约束状态值
- 每个状态变更操作都有对应的 API 和 UI 反馈
- 状态变更后自动刷新数据，确保 UI 同步

### 4. 性能优化

**问题：** 酒店表单数据量大，频繁更新会导致性能问题。

**优化措施：**

- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 稳定函数引用
- 图片懒加载，只加载可视区域图片
- 表单字段按需渲染，避免不必要的重渲染

---

## 项目结构

```
client-pc/
├── src/
│   ├── api/              # API 接口封装
│   ├── components/       # 公共组件
│   │   ├── MerchantForm/ # 商户表单组件
│   │   └── AdminList/    # 管理员列表组件
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useAutoRefresh.ts
│   │   └── useAuthTransition.ts
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   │   ├── Merchant/     # 商户端页面
│   │   └── Admin/        # 管理员端页面
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   └── App.tsx
├── public/
└── package.json
```

---

## 开发规范

### 1. 代码风格

- 使用 ESLint + Prettier 统一代码风格
- 组件使用函数式组件 + Hooks
- 类型定义优先使用 interface

### 2. 命名规范

- 组件名：PascalCase
- Hooks：camelCase，以 use 开头
- 工具函数：camelCase
- 类型定义：PascalCase

### 3. 文件组织

- 每个组件独立文件夹
- 样式文件与组件同名
- 类型定义就近原则

---

## 未来优化方向

1. **性能优化**
   - 引入 React Compiler 进一步优化渲染性能
   - 图片使用 WebP 格式，支持响应式加载
   - 虚拟滚动优化长列表性能

2. **功能增强**
   - 支持批量操作
   - 添加数据导出功能
   - 实现实时通知（WebSocket）

3. **体验优化**
   - 添加页面切换动画
   - 优化移动端适配
   - 添加操作引导（Onboarding）

---

## 总结

亦宿酒店管理系统 PC 端采用了现代化的前端技术栈，通过合理的架构设计和状态管理，实现了复杂的业务流程。双版本数据管理、本地草稿自动保存、智能自动刷新等亮点功能，显著提升了用户体验。项目代码结构清晰，类型安全，易于维护和扩展。
