# 易宿酒店预订平台

一款面向酒店行业的全链路数字化解决方案，采用 B 端管理 + C 端消费的双端架构设计。

## 项目架构

```
yisu-hotel-project/
├── client-pc/          # PC 端管理后台 (B端)
├── client-mobile/      # 移动端消费者端 (C端)
├── server/             # 后端 API 服务
└── .husky/             # Git 钩子配置
```

## 子项目说明

| 项目                              | 技术栈                       | 端口 | 说明                |
| --------------------------------- | ---------------------------- | ---- | ------------------- |
| [client-pc](./client-pc/)         | React 19 + TypeScript + Vite | 5173 | 商户/管理员管理后台 |
| [client-mobile](./client-mobile/) | React 19 + TypeScript + Vite | 5174 | 消费者端移动端应用  |
| [server](./server/)               | Node.js + Express + Prisma   | 3000 | 后端 API 服务       |

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 安装依赖

```bash
# 安装根目录依赖（Husky、Commitlint 等）
npm install

# 安装各子项目依赖
cd client-pc && npm install
cd ../client-mobile && npm install
cd ../server && npm install
```

### 启动开发环境

```bash
# 终端 1：启动后端服务
cd server && npm run dev

# 终端 2：启动 PC 端
cd client-pc && npm run dev

# 终端 3：启动移动端
cd client-mobile && npm run dev
```

## 核心功能

### B 端 - 管理后台

- **商户端**：酒店信息管理、房型配置、审核提交
- **管理员端**：酒店审核、上下线管理、Banner 运营

### C 端 - 消费者端

- **酒店搜索**：关键词搜索、多维度筛选
- **智能推荐**：基于星级、价格、位置的推荐
- **优惠展示**：自动计算最优优惠价格
- **地图导航**：高德地图集成，周边酒店探索

## 技术亮点

- **版本控制**：已上线酒店支持零停机更新
- **图片管理**：草稿/已发布双版本图片存储
- **本地草稿**：自动保存编辑内容，防止数据丢失
- **类型安全**：全项目 TypeScript 类型覆盖

## 开发规范

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

### 代码规范

- **ESLint**：代码规范检查
- **Prettier**：代码格式化
- **Husky**：Git 钩子管理
- **lint-staged**：暂存区代码自动格式化

## 项目文档

- [PC 端技术文档](./client-pc/PC_TECHNICAL_DOCUMENTATION.md)
- [移动端技术文档](./client-mobile/MOBILE_TECHNICAL_DOCUMENTATION.md)
- [后端技术文档](./server/docs/TECHNICAL.md)
- [数据库设计文档](./server/docs/DATABASE_DESIGN.md)
