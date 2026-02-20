# 项目部署指南

## 快速部署（免费方案）

### 推荐架构

| 服务       | 平台       | 用途         | 费用 |
| ---------- | ---------- | ------------ | ---- |
| 前端 PC 端 | Vercel     | 商户端       | 免费 |
| 后端 API   | Zeabur     | Node.js 服务 | 免费 |
| 数据库     | Supabase   | PostgreSQL   | 免费 |
| 文件存储   | Cloudinary | 图片存储     | 免费 |

---

## 1. 数据库部署（Supabase）

### 步骤：

1. 访问 https://supabase.com
2. 点击 "New Project"
3. 填写项目名称：yisu-hotel
4. 选择地区：Asia Pacific (Singapore)
5. 等待数据库创建完成（约 2 分钟）

### 获取连接信息：

1. 进入 Project Settings → Database
2. 复制 Connection string
3. 格式：`postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### 重要：数据库切换说明

本项目已配置为使用 **PostgreSQL**（Supabase），如果你之前使用 MySQL，需要：

1. **确认 schema.prisma 已更新**

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **本地测试连接（可选）**
   修改 `server/.env`：

   ```bash
   DATABASE_URL="postgresql://postgres:你的密码@db.xxx.supabase.co:5432/postgres"
   ```

3. **部署时会自动迁移**
   Render 的 Build Command 会自动执行迁移：
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

---

## 2. 后端部署（Zeabur - 推荐）

Zeabur 是 Render 的替代方案，免费版不需要信用卡。

### 步骤：

1. **注册/登录**
   - 访问 https://zeabur.com
   - 使用 GitHub 账号登录

2. **创建项目**
   - 点击 "Create Project"
   - 选择 "Deploy from GitHub"
   - 选择你的仓库

3. **添加后端服务**
   - 选择 `server` 目录
   - 类型选择 **Node.js**
   - Zeabur 会自动识别 package.json

4. **配置环境变量**
   在 Zeabur 的 Variables 中添加：

   ```
   DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
   JWT_SECRET=your-secret-key-here
   PORT=3000
   ```

5. **部署**
   - 点击 Deploy
   - 等待构建完成（约 3-5 分钟）
   - 获取域名：`https://yisu-hotel-api.zeabur.app`

### 备选：Render（需要信用卡验证）

如果仍想用 Render：

1. 访问 https://render.com
2. 选择 **Free** 实例类型（注意：新账号可能需要信用卡验证）
3. 配置同上

---

## 3. 前端部署（Vercel）

### 步骤：

1. **注册/登录**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置 PC 端**

   ```
   Framework Preset: Vite
   Root Directory: client-pc
   Build Command: npm run build
   Output Directory: dist
   ```

4. **添加环境变量**

   ```
   VITE_API_BASE_URL=https://yisu-hotel-api.zeabur.app/api/v1
   ```

   注意：将 `yisu-hotel-api` 替换为你实际的 Zeabur 服务名

5. **部署**
   - 点击 "Deploy"
   - 等待部署完成（约 2 分钟）
   - 获取域名：`https://yisu-hotel-pc.vercel.app`

### 重要：配置 SPA 路由

Vite 打包的单页应用（SPA）需要配置路由重写，否则直接访问 `/login` 等路径会 404。

**创建 `client-pc/vercel.json`**：

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**提交并重新部署**：

```bash
git add client-pc/vercel.json
git commit -m "add spa routing config"
git push
```

---

## 4. 配置 GitHub Secrets

在 GitHub 仓库中设置以下 Secrets：

```
RENDER_SERVICE_ID=your-render-service-id
RENDER_API_KEY=your-render-api-key
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID_PC=your-vercel-project-id
```

---

## 5. 验证部署

### 测试后端：

```bash
curl https://yisu-hotel-api.zeabur.app/api/v1/mobile/banners
```

### 测试前端：

访问 `https://yisu-hotel-project.vercel.app`

### 测试完整流程：

1. 访问首页：`https://yisu-hotel-project.vercel.app/`
2. 测试登录页：`https://yisu-hotel-project.vercel.app/login`
3. 测试注册功能：确保 API 请求发送到 `https://yisu-hotel-api.zeabur.app`

---

## 注意事项

### 免费版限制

| 平台     | 限制                                |
| -------- | ----------------------------------- |
| Zeabur   | 每月 100 小时运行时间，512MB 内存   |
| Vercel   | 每月 100GB 带宽，函数执行 1000 分钟 |
| Supabase | 500MB 数据库，2GB 带宽              |

### 优化建议

1. **Zeabur 运行时间**
   - 免费版每月 100 小时，适合测试和演示
   - 生产环境建议升级到付费版

2. **图片存储**
   - Zeabur 文件存储在重新部署后会重置
   - 建议使用 Cloudinary 或 AWS S3 存储图片

3. **数据库备份**
   - Supabase 自动每日备份
   - 可在 Dashboard 中手动导出

4. **自定义域名**
   - Vercel 支持免费自定义域名
   - Zeabur 付费版支持自定义域名

---

## 故障排查

### 后端部署失败

1. 检查 Build Logs
2. 确认环境变量设置正确
3. 确认数据库连接字符串正确

### 前端部署失败

1. 检查 Build Logs
2. 确认 API_BASE_URL 指向正确
3. 检查是否有构建错误

### 数据库连接失败

1. 检查 Supabase 项目状态
2. 确认 IP 白名单设置（允许所有 IP）
3. 检查连接字符串密码是否正确

---

## 自定义域名（可选）

### Vercel 自定义域名

1. 进入项目 Settings → Domains
2. 添加你的域名
3. 按提示配置 DNS

### Render 自定义域名

1. 进入服务 Settings → Custom Domains
2. 添加你的域名
3. 按提示配置 DNS
