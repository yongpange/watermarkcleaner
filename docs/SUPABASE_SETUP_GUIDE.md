# 🚀 Supabase 数据库设置完整指南

## 📋 目录

1. [前置准备](#前置准备)
2. [Supabase 项目创建](#supabase-项目创建)
3. [获取连接信息](#获取连接信息)
4. [配置本地环境](#配置本地环境)
5. [运行数据库迁移](#运行数据库迁移)
6. [测试数据库连接](#测试数据库连接)
7. [验证 Save 功能](#验证-save-功能)
8. [常见问题](#常见问题)

---

## 前置准备

### 需要的账号
- ✅ GitHub 账号（用于登录 Supabase）
- ✅ 邮箱（用于接收通知）

### 需要的工具
- ✅ Node.js 18+ 和 pnpm
- ✅ 代码编辑器（VS Code）
- ✅ 浏览器（Chrome/Edge）

---

## Supabase 项目创建

### 步骤 1: 访问 Supabase 官网

```
https://supabase.com
```

### 步骤 2: 登录/注册

1. 点击右上角 **"Start your project"**
2. 选择 **"Sign in with GitHub"**（推荐）
3. 授权 Supabase 访问你的 GitHub 账号

### 步骤 3: 创建新项目

1. 点击 **"New Project"** 按钮
2. 填写项目信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Organization** | 选择或创建 | 可以创建新的组织 |
| **Name** | `ai-turbolearn-template` | 项目名称（可自定义） |
| **Database Password** | 生成强密码 | ⚠️ **务必保存此密码** |
| **Region** | `Northeast Asia (Tokyo)` | 选择离你最近的区域 |
| **Pricing Plan** | `Free` | 免费计划（足够开发使用） |

3. 点击 **"Create new project"**
4. 等待 1-2 分钟（项目初始化中...）

### 步骤 4: 项目创建成功

看到项目仪表板后，说明创建成功！🎉

---

## 获取连接信息

### 方法 1: 获取数据库连接字符串

1. 进入项目后，点击左侧 **Settings** ⚙️
2. 点击 **Database**
3. 滚动到 **Connection string** 部分
4. 选择 **URI** 标签页
5. 复制连接字符串：

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

6. **重要**：将 `[YOUR-PASSWORD]` 替换为你创建项目时设置的密码

**示例**：
```
# 原始（带占位符）
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres

# 替换后（实际可用）
postgresql://postgres:MyStr0ngP@ssw0rd@db.abcdefghijk.supabase.co:5432/postgres
```

### 方法 2: 获取 Supabase API Keys

1. 点击左侧 **Settings** ⚙️
2. 点击 **API**
3. 复制以下内容：

| 字段 | 位置 | 用途 |
|------|------|------|
| **Project URL** | Configuration → URL | 前端 API 调用 |
| **anon public** | Project API keys → anon | 公开 API Key |
| **service_role** | Project API keys → service_role | 服务端 API Key（⚠️ 保密） |

---

## 配置本地环境

### 步骤 1: 创建 `.env.local` 文件

```bash
# 如果没有 .env.local，从示例文件复制
cp .env.example .env.local
```

### 步骤 2: 编辑 `.env.local`

打开 `.env.local` 文件，添加以下配置：

```env
# ==================== Supabase Database ====================
# 从 Supabase Dashboard > Settings > Database > Connection string 获取
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# 可选：Direct connection (用于 Drizzle Studio)
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# ==================== Supabase API Keys ====================
# 从 Supabase Dashboard > Settings > API 获取
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxxxxxxxxxxxxxx..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxxxxxxxxxxxxxx..."
```

### 步骤 3: 验证配置

```bash
# 检查环境变量是否正确加载
node -e "console.log(process.env.DATABASE_URL)"
```

---

## 运行数据库迁移

### 步骤 1: 检查现有迁移文件

```bash
# 查看迁移文件
ls src/db/migrations/

# 应该看到：
# 0000_init.sql
# 0001_icy_zzzax.sql
# meta/
```

### 步骤 2: 推送 Schema 到 Supabase

```bash
# 方法 1: 直接推送（推荐，快速）
pnpm db:push

# 方法 2: 生成并运行迁移（更安全）
pnpm db:generate  # 生成新的迁移文件
pnpm db:migrate   # 应用迁移到数据库
```

**预期输出**：
```
✓ Applying migrations...
✓ Migrations applied successfully!
```

### 步骤 3: 验证数据库表

#### 方法 1: 使用 Drizzle Studio（本地）

```bash
pnpm db:studio

# 浏览器自动打开 https://local.drizzle.studio
```

#### 方法 2: 使用 Supabase Dashboard（在线）

1. 进入 Supabase Dashboard
2. 点击左侧 **Table Editor**
3. 查看表列表

**应该看到的表**：
- ✅ `users` - 用户表
- ✅ `orders` - 订单表
- ✅ `credits` - 积分表
- ✅ `apikeys` - API 密钥表
- ✅ `posts` - 文章表
- ✅ `affiliates` - 联盟营销表
- ✅ `feedbacks` - 反馈表
- ✅ `conversions` ⭐ - **文档转换表（用于保存文档）**
- ✅ `user_preferences` - 用户偏好表

---

## 测试数据库连接

### 步骤 1: 创建测试脚本

创建 `scripts/test-db.ts` 文件：

```typescript
import { db } from '@/db';
import { users, conversions } from '@/db/schema';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // 测试 1: 查询用户表
    const userResult = await db.select().from(users).limit(1);
    console.log('✅ Users table accessible');
    
    // 测试 2: 查询转换表
    const conversionResult = await db.select().from(conversions).limit(1);
    console.log('✅ Conversions table accessible');
    
    console.log('🎉 Database connection successful!');
    console.log('📊 Sample data:', { userResult, conversionResult });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

### 步骤 2: 添加测试命令

编辑 `package.json`，添加：

```json
{
  "scripts": {
    "db:test": "tsx scripts/test-db.ts"
  }
}
```

### 步骤 3: 运行测试

```bash
pnpm db:test
```

**预期输出**：
```
🔍 Testing database connection...
✅ Users table accessible
✅ Conversions table accessible
🎉 Database connection successful!
📊 Sample data: { userResult: [], conversionResult: [] }
```

---

## 验证 Save 功能

### 步骤 1: 启动开发服务器

```bash
pnpm dev
```

### 步骤 2: 测试完整流程

1. 访问 http://localhost:3001/en/convert
2. 上传一个 Word 文件（或 PDF/TXT）
3. 等待转换完成
4. 点击 **"Advanced Edit"** 按钮
5. 进入 Workspace 页面
6. 编辑 Markdown 内容
7. 点击 **"Save"** 按钮
8. 看到提示：**"Document saved to database successfully"** ✅

### 步骤 3: 验证数据库中的数据

#### 方法 1: 使用 Drizzle Studio

```bash
pnpm db:studio
```

1. 打开 `conversions` 表
2. 查看最新的记录
3. 检查 `result` 字段中的 `content` 是否已更新

#### 方法 2: 使用 Supabase Dashboard

1. 进入 Supabase Dashboard
2. 点击 **Table Editor**
3. 选择 `conversions` 表
4. 查看最新记录的 `result` 字段

### 步骤 4: 测试数据持久化

1. 关闭浏览器标签页
2. 重新打开 http://localhost:3001/en/workspace?fileId=xxx
3. 确认内容仍然存在（从数据库加载）✅

---

## 常见问题

### Q1: 连接数据库失败

**错误信息**：
```
Error: connect ECONNREFUSED
```

**解决方案**：
1. 检查 `DATABASE_URL` 是否正确
2. 确认密码中的特殊字符是否需要 URL 编码
3. 检查网络连接（是否能访问 Supabase）
4. 确认 Supabase 项目状态（是否暂停）

### Q2: 密码包含特殊字符

**问题**：密码中有 `@` `#` `%` 等特殊字符

**解决方案**：使用 URL 编码

```javascript
// 在线工具：https://www.urlencoder.org/
// 或使用 JavaScript
const password = "My@Pass#123";
const encoded = encodeURIComponent(password);
console.log(encoded); // My%40Pass%23123
```

### Q3: 迁移失败

**错误信息**：
```
Error: relation "users" already exists
```

**解决方案**：
```bash
# 方法 1: 使用 db:push（覆盖）
pnpm db:push

# 方法 2: 手动删除表后重新迁移
# 在 Supabase Dashboard > SQL Editor 执行：
DROP TABLE IF EXISTS users, orders, credits, apikeys, posts, affiliates, feedbacks, conversions, user_preferences CASCADE;

# 然后重新运行迁移
pnpm db:migrate
```

### Q4: Drizzle Studio 无法连接

**错误信息**：
```
Failed to connect to database
```

**解决方案**：
1. 确认 `DATABASE_URL` 或 `DIRECT_URL` 已设置
2. 检查防火墙设置
3. 尝试使用 `DIRECT_URL` 而非 `DATABASE_URL`

### Q5: Save 功能返回 404

**错误信息**：
```
Conversion not found
```

**解决方案**：
1. 确认 `fileId` 参数正确
2. 检查 `conversions` 表中是否有对应记录
3. 确认转换流程已完成（status = 'completed'）

---

## 🎉 设置完成检查清单

- [ ] Supabase 项目已创建
- [ ] 数据库连接字符串已获取
- [ ] `.env.local` 已配置
- [ ] 数据库迁移已运行
- [ ] 数据库表已创建（9 个表）
- [ ] 数据库连接测试通过
- [ ] Save API 已创建
- [ ] Workspace 客户端已更新
- [ ] Save 功能测试通过
- [ ] 数据持久化验证通过

---

## 📚 下一步：Redis 缓存集成

Supabase 数据库设置完成后，你可以继续设置 Redis 缓存：

1. **选择 Redis 服务**：
   - Upstash Redis（推荐，免费计划）
   - Redis Cloud
   - 本地 Redis（开发环境）

2. **集成用途**：
   - 缓存 AI 生成的笔记（避免重复调用 DeepSeek API）
   - 缓存文档转换结果
   - 会话管理
   - 限流（Rate Limiting）

3. **预计时间**：15-20 分钟

准备好后告诉我，我会提供详细的 Redis 设置指南！🚀

---

**文档创建时间**: 2025-10-30  
**适用版本**: Next.js 15 + Supabase + Drizzle ORM  
**状态**: ✅ 生产就绪

