# 易宿酒店管理系统 - PC端

易宿酒店管理系统 PC 端，为酒店商户和管理员提供完整的酒店管理解决方案。

## 项目简介

本项目是易宿酒店预订平台的 B 端管理后台，采用 React + TypeScript + Vite 技术栈开发，包含商户端和管理员端两个子系统。

### 功能模块

| 模块         | 说明                              |
| ------------ | --------------------------------- |
| **商户端**   | 酒店信息管理、房型配置、审核提交  |
| **管理员端** | 酒店审核、上下线管理、Banner 运营 |

## 技术栈

- **框架**: React 19
- **语言**: TypeScript 5
- **构建工具**: Vite 6
- **UI 组件库**: Ant Design 5
- **样式**: SCSS + Ant Design 主题样式
- **状态管理**: Zustand
- **路由**: React Router v7
- **HTTP 客户端**: Axios

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
npm run dev
```

服务将启动在 http://localhost:5173

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── MerchantForm/    # 商户表单组件
│   ├── Location/        # 地图选址组件
│   └── ui/              # 基础 UI 组件
├── pages/               # 页面
│   ├── Merchant/        # 商户端页面
│   │   ├── Dashboard/   # 商户仪表盘
│   │   └── HotelForm/   # 酒店表单
│   └── Admin/           # 管理员端页面
│       ├── Dashboard/   # 管理仪表盘
│       └── HotelList/   # 酒店列表
├── hooks/               # 自定义 Hooks
├── stores/              # Zustand 状态管理
├── utils/               # 工具函数
├── theme/               # 主题配置
└── types/               # TypeScript 类型定义
```

## 核心功能

### 商户端

- **酒店管理**: 基础信息、房型配置、设施管理
- **图片上传**: 多图上传、拖拽排序、预览功能
- **版本控制**: 草稿/已发布双版本管理
- **本地草稿**: 自动保存、过期提醒、一键恢复
- **地图选址**: 高德地图集成、可视化位置选择

### 管理员端

- **审核管理**: 酒店列表、详情查看、通过/驳回
- **版本对比**: 线上版本 vs 待审核版本对比
- **状态管理**: 发布、下线、恢复操作
- **Banner 运营**: 首页轮播配置、排序管理
- **数据统计**: Dashboard 数据概览

## 开发规范

### 代码风格

- 使用 ESLint + Prettier 统一代码风格
- 组件使用 PascalCase 命名
- 工具函数使用 camelCase 命名

### 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

## 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AMAP_KEY=你的高德地图Key
```

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 相关项目

- [移动端 C 端](../client-mobile/) - 消费者端应用
- [后端服务](../server/) - API 服务

## 许可证

MIT
