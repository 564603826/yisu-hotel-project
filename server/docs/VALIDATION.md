# 数据校验文档

## 概述

本文档描述了系统中所有接口的数据校验规则和错误处理机制。

## 统一校验原则

1. **必填字段检查**: 所有必填参数必须存在且非空
2. **格式验证**: 根据业务规则验证数据格式
3. **长度限制**: 验证字符串长度是否符合要求
4. **枚举值验证**: 枚举类型字段必须匹配预定义值
5. **业务规则验证**: 验证业务逻辑约束

## 注册接口校验

### 接口信息

- **接口**: `POST /api/v1/auth/register`
- **Content-Type**: `application/json`

### 请求参数校验

#### 1. 必填字段检查

**校验规则**:

- `username`: 必填，非空字符串
- `password`: 必填，非空字符串
- `role`: 必填，非空字符串

**错误响应**:

```json
{
  "code": 400,
  "msg": "缺少必填字段",
  "data": null
}
```

#### 2. 用户名校验

**校验规则**:

- 类型: 字符串
- 长度: 3-20 位
- 允许字符: 字母（a-z, A-Z）、数字（0-9）、下划线（\_）
- 正则表达式: `/^[a-zA-Z0-9_]{3,20}$/`

**有效示例**:

```
✓ user123
✓ test_user
✓ Admin
✓ merchant_01
```

**无效示例**:

```
✗ ab (长度不足)
✗ user@name (包含特殊字符)
✗ user-name (包含连字符)
✗ user name (包含空格)
✗ thisusernameistoolong (超过20位)
```

**错误响应**:

```json
{
  "code": 400,
  "msg": "用户名格式不正确",
  "data": null
}
```

#### 3. 密码校验

**校验规则**:

- 类型: 字符串
- 长度: 6-20 位
- 存储: 使用 bcrypt 加密（salt rounds: 10）

**有效示例**:

```
✓ 123456
✓ password123
✓ P@ssw0rd
✓ abcdefghijklmnopqrst
```

**无效示例**:

```
✗ 12345 (长度不足)
✗ thispasswordistoolong (超过20位)
```

**错误响应**:

```json
{
  "code": 400,
  "msg": "密码长度必须在6-20位之间",
  "data": null
}
```

#### 4. 角色校验

**校验规则**:

- 类型: 字符串
- 枚举值: `merchant` 或 `admin`

**有效值**:

```
✓ merchant
✓ admin
```

**无效值**:

```
✓ user
✓ superadmin
✓ Merchant (大小写敏感)
✓ ADMIN (大小写敏感)
```

**错误响应**:

```json
{
  "code": 400,
  "msg": "角色无效",
  "data": null
}
```

#### 5. 用户名唯一性校验

**校验规则**:

- 用户名在数据库中必须唯一
- 如果已存在相同用户名，拒绝注册

**错误响应**:

```json
{
  "code": 409,
  "msg": "用户名已存在",
  "data": null
}
```

### 完整校验流程

```
请求到达
    ↓
检查必填字段
    ↓ (通过)
检查用户名格式
    ↓ (通过)
检查密码长度
    ↓ (通过)
检查角色有效性
    ↓ (通过)
检查用户名唯一性
    ↓ (通过)
创建用户
    ↓
返回成功响应
```

## 登录接口校验

### 接口信息

- **接口**: `POST /api/v1/auth/login`
- **Content-Type**: `application/json`

### 请求参数校验

#### 1. 必填字段检查

**校验规则**:

- `username`: 必填，非空字符串
- `password`: 必填，非空字符串

**错误响应**:

```json
{
  "code": 400,
  "msg": "缺少必填字段",
  "data": null
}
```

#### 2. 用户存在性校验

**校验规则**:

- 用户名必须在数据库中存在

**错误响应**:

```json
{
  "code": 401,
  "msg": "密码错误",
  "data": null
}
```

**注意**: 为了安全考虑，用户不存在和密码错误返回相同的错误消息，防止用户名枚举攻击。

#### 3. 密码验证

**校验规则**:

- 使用 bcrypt 验证密码
- 与数据库中存储的加密密码比对

**错误响应**:

```json
{
  "code": 401,
  "msg": "密码错误",
  "data": null
}
```

### 完整校验流程

```
请求到达
    ↓
检查必填字段
    ↓ (通过)
查询用户
    ↓ (用户存在)
验证密码
    ↓ (通过)
生成 JWT 令牌
    ↓
返回成功响应
```

## 需要认证的接口

### Token 校验

**校验规则**:

- 请求头必须包含 `Authorization` 字段
- Token 格式: `Bearer <token>`
- Token 必须有效且未过期

**请求头示例**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**错误响应**:

缺少 Token:

```json
{
  "code": 401,
  "msg": "Access token required",
  "data": null
}
```

Token 无效或过期:

```json
{
  "code": 403,
  "msg": "Invalid or expired token",
  "data": null
}
```

## 响应数据过滤

### 密码字段过滤

出于安全考虑，所有响应中都不包含密码字段：

**数据库存储**:

```json
{
  "id": 1,
  "username": "merchant1",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMy...",
  "role": "merchant",
  "createdAt": "2026-02-11T04:33:21.031Z"
}
```

**API 响应**:

```json
{
  "id": 1,
  "username": "merchant1",
  "role": "merchant",
  "createdAt": "2026-02-11T04:33:21.031Z"
}
```

### 用户信息过滤

登录接口返回的用户信息仅包含必要字段：

```json
{
  "userId": 1,
  "username": "merchant1",
  "role": "merchant"
}
```

## 错误码映射

| 场景           | HTTP Code | Code | 消息                     |
| -------------- | --------- | ---- | ------------------------ |
| 缺少必填字段   | 400       | 400  | 缺少必填字段             |
| 用户名格式错误 | 400       | 400  | 用户名格式不正确         |
| 密码长度错误   | 400       | 400  | 密码长度必须在6-20位之间 |
| 角色无效       | 400       | 400  | 角色无效                 |
| 用户名已存在   | 409       | 409  | 用户名已存在             |
| 密码错误       | 401       | 401  | 密码错误                 |
| Token 缺失     | 401       | 401  | Access token required    |
| Token 无效     | 403       | 403  | Invalid or expired token |
| 内部错误       | 500       | 500  | 内部服务器错误           |

## 安全考虑

### 1. 密码安全

- 使用 bcrypt 加密，salt rounds 设为 10
- 不在日志中记录明文密码
- 不在响应中返回密码

### 2. 用户名安全

- 用户不存在和密码错误返回相同消息
- 防止用户名枚举攻击

### 3. 输入验证

- 所有输入都进行校验
- 使用正则表达式验证格式
- 限制输入长度

### 4. SQL 注入防护

- 使用 Prisma ORM 自动防护
- 不使用原生 SQL 查询

## 扩展校验建议

### 1. 邮箱验证

如果需要邮箱注册，可添加：

```javascript
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return responseHandler.badRequest(res, '邮箱格式不正确')
}
```

### 2. 手机号验证

如果需要手机号注册，可添加：

```javascript
if (!/^1[3-9]\d{9}$/.test(phone)) {
  return responseHandler.badRequest(res, '手机号格式不正确')
}
```

### 3. 密码强度验证

可添加密码强度检查：

```javascript
if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
  return responseHandler.badRequest(res, '密码必须包含大小写字母和数字')
}
```

### 4. 限流验证

可添加注册频率限制：

```javascript
const rateLimit = require('express-rate-limit')

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次
  message: '注册次数过多，请稍后再试',
})

app.use('/api/v1/auth/register', registerLimiter)
```
