# 易宿酒店管理系统 - 移动端

## 项目介绍

易宿酒店管理系统是一个面向酒店行业的全端解决方案，采用前后端分离架构。移动端面向用户，提供酒店搜索、浏览、详情查看等核心功能，为用户提供便捷的酒店预订体验。

## 技术栈

| 类别       | 技术选型         | 版本    |
| ---------- | ---------------- | ------- |
| 框架       | React            | 19.2.0  |
| 开发语言   | TypeScript       | 5.9.3   |
| 构建工具   | Vite             | 7.2.4   |
| 状态管理   | Redux Toolkit    | 2.2.1   |
| 路由       | React Router DOM | 7.13.0  |
| HTTP客户端 | Axios            | 1.6.7   |
| UI组件库   | Vant             | 4.8.2   |
| 轮播组件   | Swiper           | 11.0.6  |
| 日期处理   | date-fns         | 3.3.1   |
| 数据验证   | Zod             | 3.22.4  |
| 地图服务   | 高德地图 API      | 1.0.1   |
| 样式预处理器 | SCSS            | 1.97.3  |

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── common/          # 通用组件
│   │   ├── Footer/      # 页脚组件
│   │   ├── Header/      # 头部组件
│   │   ├── Layout/      # 布局组件
│   │   └── LocationPicker/ # 位置选择器
│   ├── home/            # 首页组件
│   │   ├── Banner/      # 轮播图组件
│   │   ├── QuickFilters/ # 快速筛选组件
│   │   └── SearchBar/   # 搜索栏组件
│   ├── hotelDetail/     # 酒店详情组件
│   │   ├── ImageGallery/ # 图片画廊组件
│   │   └── RoomList/    # 房型列表组件
│   └── hotelList/       # 酒店列表组件
│       ├── FilterPanel/  # 筛选面板组件
│       ├── HotelCard/    # 酒店卡片组件
│       └── SortPanel/    # 排序面板组件
├── pages/               # 页面目录
│   ├── HomePage/        # 首页
│   ├── HotelDetailPage/ # 酒店详情页
│   └── HotelListPage/   # 酒店列表页
├── routes/              # 路由配置
│   └── index.tsx        # 路由定义
├── services/            # API服务
│   └── api.ts           # API接口封装
├── styles/              # 样式文件
│   ├── _variables.scss  # 变量定义
│   ├── global.scss      # 全局样式
│   └── mixins.scss      # 样式混合器
├── types/               # TypeScript类型定义
│   └── api.ts           # API相关类型
├── App.tsx              # 应用入口
└── main.tsx             # 主入口
```

## 功能特性

### 首页
- 轮播图展示：展示酒店促销活动和推荐信息
- 快速筛选标签：提供常用筛选条件的快速访问
- 搜索栏：支持关键词搜索酒店

### 酒店列表页
- 酒店卡片展示：显示酒店图片、名称、价格、评分等信息
- 筛选功能：支持价格、星级、设施等多维度筛选
- 排序功能：支持推荐、价格、评分、距离等排序方式

### 酒店详情页
- 图片画廊：展示酒店多张图片，支持轮播和预览
- 酒店信息：显示酒店名称、地址、评分、联系方式等
- 房型列表：展示酒店不同房型，包括价格、面积、床型等信息

### 位置选择器
- 地图展示：显示当前位置和周边酒店
- 搜索功能：支持关键词搜索地点
- 定位功能：获取当前位置

## 安装与运行

### 前置条件
- Node.js 16.0 或更高版本
- npm 7.0 或更高版本

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
# 启动开发服务器
npm run dev

# 启动移动端开发服务器（支持局域网访问）
npm run dev:mobile
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 开发指南

### 代码风格
- 使用 ESLint + Prettier 统一代码风格
- 组件使用函数式组件 + Hooks
- 类型定义优先使用 interface

### 命名规范
- 组件名：PascalCase
- Hooks：camelCase，以 use 开头
- 工具函数：camelCase
- 类型定义：PascalCase
- 文件和目录名：kebab-case 或 PascalCase（组件目录）

### 开发流程
1. 克隆仓库
2. 安装依赖
3. 启动开发服务器
4. 编写代码
5. 运行类型检查：`npm run type-check`
6. 运行代码检查：`npm run lint`
7. 构建生产版本：`npm run build`

## 环境变量

项目使用 `.env` 文件管理环境变量，主要配置：

- `VITE_API_BASE_URL`：API 基础 URL
- `VITE_AMAP_KEY`：高德地图 API 密钥

## 构建与部署

### 构建

```bash
npm run build
```

构建产物位于 `dist` 目录，包含：
- 压缩后的 JavaScript 文件
- 压缩后的 CSS 文件
- 静态资源文件

### 部署

可以将 `dist` 目录部署到任何静态文件服务器，如：
- Nginx
- Apache
- Vercel
- Netlify
- GitHub Pages

## 贡献指南

1. Fork 仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 打开 Pull Request

## 许可证

MIT License

## 联系方式

- 项目维护者：易宿团队
- 邮箱：contact@yisu.com
- 网站：https://www.yisu.com

---

**易宿酒店管理系统** - 为酒店行业提供专业的全端解决方案