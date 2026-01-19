# WatermarkCleaner 网站架构文档

## 项目概述

**WatermarkCleaner** 是现代化的 AI 驱动水印去除网站，基于 Next.js 15、React 19 和 TypeScript 构建，支持多语言国际化。

**✅ 最新功能**

- **CREEM支付系统** (2026-01-18): 完整迁移支付架构，支持 Creem/Stripe/PayPal
- **统一额度系统** (2026-01-09): 所有用户（登录/未登录）统一为 **3次额度（终身）**
- **Google OAuth** (2026-01-08): 完整 OAuth 2.0 流程，自动登录并升级用户等级
- **博客系统**: 基于文件系统的 MDX 内容管理，实时更新无需重新构建
- **安全记录系统**: IP 地址 SHA-256 加盐哈希，符合 GDPR 要求

---

## 1. 技术栈

### 核心技术
- **Next.js 15.3.8** (App Router) + **React 19** + **TypeScript 5.7.2**
- **Tailwind CSS 4.1.4** + **Radix UI**
- **Supabase** (PostgreSQL 数据库 + 认证)
- **NextAuth.js 5.0.0-beta** (Google OAuth + 邮箱验证码)

### AI & 图像处理
- **Fal.ai**: SDXL Inpainting (主要服务)
- **ByteDance Ark API**: SeedEdit (中国市场)

### 存储 & CDN
- **Cloudflare R2** (S3 兼容对象存储)
- **Vercel Edge Network**

### 支付系统
- **Creem** (主支付提供商) + Stripe + PayPal
- **双轨额度管理**: Free 用户使用 `wmc_processing_history`，Pro 用户使用 `wmc_credit` (FIFO)

---

## 2. 项目结构

```
watermarkcleaner_com/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # 国际化路由 (en, zh, es, ar, ru, fr, ko)
│   │   │   ├── (default)/            # 主应用
│   │   │   │   ├── (console)/        # 用户控制台
│   │   │   │   │   ├── my-credits/   # 我的额度
│   │   │   │   │   ├── api-keys/     # API 密钥管理
│   │   │   │   │   └── orders/       # 订单历史
│   │   │   │   └── convert/          # 水印编辑器
│   │   │   ├── blog/                 # 博客系统
│   │   │   ├── auth/                 # 认证页面
│   │   │   └── pricing/              # 定价页面
│   │   └── api/                      # API 路由
│   │       ├── auth/                 # 认证 API
│   │       ├── convert/              # 转换 API
│   │       ├── credits/              # 额度检查 API
│   │       ├── payment/              # 支付系统 API
│   │       └── upload/               # 文件上传
│   ├── components/                   # React 组件
│   │   ├── blocks/                   # 页面区块组件
│   │   ├── ui/                       # UI 组件库
│   │   ├── watermark-editor/         # 编辑器主组件
│   │   └── auth/                     # 认证组件 (Apple 设计风格)
│   ├── lib/                          # 工具库
│   │   ├── credits/                  # 额度管理系统
│   │   ├── storage.ts                # 存储服务
│   │   ├── supabase-*.ts             # Supabase 客户端
│   │   └── auth.config.ts            # 认证配置
│   ├── i18n/                         # 国际化配置
│   └── types/                        # TypeScript 类型
├── content/blog/                     # MDX 博客内容
└── scripts/                          # 工具脚本
```

---

## 3. 核心功能模块

### 3.1 水印编辑器

**架构**: 服务端组件 (`page.tsx`) + 客户端组件 (`convert-page-client.tsx`) 混合渲染

**核心流程**:
1. **上传** → 支持 JPG, PNG, WEBP, GIF (最大 10MB)
2. **预览** → 客户端生成缩略图
3. **处理** → 调用 Fal.ai 或 ByteDance API (自动/保守/激进模式)
4. **结果** → 响应式图片对比组件，支持下载

**额度刷新机制**:
- `ConvertPageClient` 管理 `processingCount` state
- `CreditsDisplay` 通过 `key={processingCount}` 强制重新渲染
- 处理成功后回调触发，实时更新额度显示

### 3.2 博客系统

**架构**: 基于文件系统的 MDX 内容管理

```
content/blog/post-slug/
├── index.json    # 文章元数据（标题、描述、日期、作者、标签）
├── en.mdx        # 英文内容
└── zh.mdx        # 中文内容
```

**特性**:
- 实时更新，无需重新构建
- 多语言支持（7种语言）
- SEO 优化（结构化数据、Meta 标签、站点地图）
- ISR + SSG 性能优化

### 3.3 用户认证

**认证方式**:
- **Google OAuth**: 一键登录，自动获得 `verified` 等级
- **邮箱验证码**: 无密码登录，6位数字，5分钟有效期，IP 速率限制
- **邮箱链接**: 传统 Magic Link 验证

**NextAuth.js v5**:
- 从 `getServerSession()` 迁移到 `auth()` API
- 完整 TypeScript 类型安全
- 自动用户信息同步

**用户体系**:
```typescript
enum UserTier {
  unverified = "未验证",    // 3次（终身）
  verified = "已验证",      // 3次（终身）
  pro = "专业版"            // 无限
}
```

### 3.4 额度管理系统

**统一额度策略** (2026-01-09):
- **所有用户**: 3次额度（终身 / lifetime，不重置）
- **Pro 用户**: 升级到 Pro 后获得无限额度
- **计算方式**: 基于 `wmc_processing_history` 表的成功处理记录数

**安全特性**:
- **IP 匿名化**: SHA-256 加盐哈希，64字符存储，原始 IP 永不保存
- **Service Role Key**: 服务端专用 API 绕过 RLS 限制
- **数据清理**: 72小时自动清理（失败记录），符合 GDPR

**API 端点**:
- `GET /api/credits/check` - 已登录用户检查
- `GET /api/credits/check-ip` - 未登录用户检查（IP 哈希）
- `POST /api/record-processing` - 记录处理历史

### 3.5 支付系统

**新增表** (2026-01-18):

**wmc_order**: 支付订单管理
- 订单号 `order_no` (ORD-前缀)
- 多支付提供商支持 (Creem/Stripe/PayPal)
- 状态管理 (pending/paid/canceled)

**wmc_subscription**: 订阅生命周期管理
- 订阅周期 (month/year)
- 自动续费和额度授予
- 状态追踪 (active/trialing/canceled)

**wmc_credit**: 精确额度管理（FIFO）
- 交易记录 (grant/consume)
- 实时余额计算 `SUM(credits)`
- 过期机制支持

**wmc_config**: 系统配置
- 产品 ID 映射 (JSON)
- 多提供商配置

**关键特性**:
- **双轨额度**: Free/Pro 用户分别管理
- **事务安全**: 数据库事务保证一致性
- **幂等性**: Webhook 处理防重复授予

---

## 4. API 接口

### 通用上传
```
POST /api/upload
- 限制: 10MB, JPG/PNG/WEBP/GIF/PDF/DOC
- 响应: { success, data: { id, filename, size, url, key } }
```

### AI 处理
```
POST /api/inpaint     # Fal.ai 水印去除
POST /api/seededit    # ByteDance 水印去除
POST /api/convert     # 统一转换 API
```

### 额度管理
```
GET  /api/credits/check     # 已登录用户检查
GET  /api/credits/check-ip  # 未登录用户检查
POST /api/record-processing # 记录处理历史
```

### 支付系统
```
POST /api/payment/checkout        # 创建支付会话
POST /api/payment/notify/[provider] # Webhook 通知处理
```

### 管理接口
```
POST /api/admin/cleanup   # 获取清理统计（需 Admin Key）
GET  /api/admin/cleanup?days=3 # 手动触发清理
```

---

## 5. 数据库架构

### 核心表结构

```sql
-- 用户表
CREATE TABLE public.wmc_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  tier TEXT DEFAULT 'unverified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 处理历史（额度追踪）
CREATE TABLE public.wmc_processing_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES wmc_users(id),
  ip_address TEXT,              -- IP哈希（未登录用户）
  image_size INTEGER,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 支付订单
CREATE TABLE public.wmc_order (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES wmc_users(id),
  product_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订阅管理
CREATE TABLE public.wmc_subscription (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES wmc_users(id),
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  interval TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 信用额度（Pro用户）
CREATE TABLE public.wmc_credit (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES wmc_users(id),
  transaction_type TEXT NOT NULL,  -- grant/consume
  credits INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 系统配置
CREATE TABLE public.wmc_config (
  name TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT
);
```

**索引优化**: `idx_processing_history_user_date`, `idx_processing_history_ip_date`

---

## 6. 环境变量

```bash
# 必需
NEXT_PUBLIC_WEB_URL=https://watermarkcleaner.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=

# IP 哈希盐值 (32字节随机)
IP_HASH_SALT=

# AI API
FAL_AI_API_KEY=
ARK_API_KEY=

# 存储
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

# 邮件
RESEND_API_KEY=
EMAIL_FROM=WatermarkCleaner <noreply@watermarkcleaner.com>

# 数据保留
DATA_RETENTION_DAYS=3
```

**获取 Google OAuth 凭据**:
1. Google Cloud Console → 启用 Google+ API
2. OAuth 同意屏幕 → 创建 OAuth 2.0 客户端 ID
3. 重定向 URI: `http://localhost:3000/api/auth/callback/google`

---

## 7. 部署与 DevOps

**部署平台**: Vercel (主) / Cloudflare Pages (备)

**构建命令**:
```bash
npm install
npm run dev          # 开发
npm run build        # 构建
npm run type-check   # 类型检查
npm run lint         # 代码检查
```

**CI/CD**: Git + Vercel 自动部署

---

## 8. 开发指南

### 添加新博客文章
1. 创建目录: `content/blog/post-slug/`
2. 添加元数据: `index.json`
3. 创建内容: `en.mdx`, `zh.mdx`
4. 自动同步，无需重启

### 调试技巧
- 使用 `console.log` + 环境变量控制日志
- Supabase 本地开发模式
- Chrome DevTools Performance 分析

---

## 9. 总结

### 项目优势
- ✅ 现代化 Next.js App Router 架构
- ✅ 7种语言国际化支持
- ✅ 多 AI 提供商容错设计
- ✅ 基于文件系统的博客系统（实时更新）
- ✅ 统一额度管理（3次终身，Pro无限）
- ✅ IP 匿名化 + GDPR 合规
- ✅ SEO 优化（结构化数据、ISR + SSG）

### 改进方向
- WebSocket 实时进度更新
- Playwright E2E 测试覆盖
- Sentry/DataDog 监控告警
- 手动遮罩工具
- 批处理功能
- 社区功能（评论、点赞）

---

**文档版本**: 2.1 精简版
**最后更新**: 2026-01-18
**维护者**: Claude Code AI
