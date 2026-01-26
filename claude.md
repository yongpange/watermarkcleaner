# WatermarkCleaner 架构文档

## 项目概述
基于 Next.js 15 (App Router) + Cloudflare Pages 的 AI 去水印网站。
主要功能：AI 图片处理、多语言支持、用户额度管理、博客系统。

## 1. 技术栈

- **框架**: Next.js 15, React 19, TypeScript
- **样式**: Tailwind CSS 4, Radix UI
- **AI 服务**: 
  - Fal.ai (SDXL)
  - ByteDance Ark (Doubao-Seedream-4.0 / SeedEdit)
- **数据库**: Supabase (PostgreSQL)
- **认证**: NextAuth.js v5 (Google OAuth + 邮箱验证码)
- **存储**: Cloudflare R2
- **部署**: Cloudflare Pages (Edge Runtime)

## 2. 核心模块

### 2.1 认证 (NextAuth v5)
- **适配器**: `CustomSupabaseAdapter` 直接操作 `wmc_*` 表
- **策略**: JWT Session
- **方式**: Google OAuth (自动验证), 邮箱验证码

### 2.2 额度系统
- **策略**: 所有用户默认 3 次终身额度，Pro 用户无限
- **表**: `wmc_processing_history` (Free), `wmc_credit` (Pro)
- **IP 限制**: SHA-256 加盐哈希追踪未登录用户
- **UI交互**: 支持静默更新（Silent Revalidation），极简风格展示

### 2.3 支付 (Creem/Stripe)
- **订单**: `wmc_order`
- **订阅**: `wmc_subscription`
- **Webhook**: 异步处理充值与续费

### 2.4 图像处理 (Watermark Editor)
- **模型**: `doubao-seedream-4-0-250828`
- **特性**: 
  - 智能比例识别 (Smart Aspect Ratio)
  - 多分辨率支持 (21:9, 16:9, 1:1, etc.)
  - 4K 超高清输出支持

### 2.5 其他
- **博客**: 基于文件系统的 MDX，支持多语言动态路由
- **API**: Edge Runtime 兼容，使用 `Uint8Array` 替代 `Buffer`

## 3. 环境变量 (.env.local)

```bash
# 基础
NEXT_PUBLIC_WEB_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI 服务
FAL_AI_API_KEY=
ARK_API_KEY=
ARK_API_URL=

# 其他
RESEND_API_KEY=
EMAIL_FROM=
IP_HASH_SALT=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
```

## 4. 数据库表结构 (Supabase)

所有表位于 `public` schema，外键指向 `wmc_users`。

- `wmc_users`: 用户表 (ID, email, tier, creditsused)
- `wmc_accounts`: OAuth 关联
- `wmc_sessions`: 登录会话
- `wmc_processing_history`: 处理记录 (IP/UserID)
- `wmc_order`: 支付订单
- `wmc_subscription`: 订阅状态
- `wmc_credit`: Pro 用户额度池
- `wmc_config`: 系统配置

## 5. 开发工具 & MCP

- **Playwright MCP**: 全局安装 `playwright-mcp`，支持浏览器自动化操作。
- **Browser Tool**: 内置浏览器测试工具。

## 6. 开发命令

```bash
npm run dev          # 本地开发
npm run build        # 构建
npm run cf:deploy    # 部署到 Cloudflare Pages
```

---
*Last Updated: 2026-01-26*
