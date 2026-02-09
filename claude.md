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
- **缓存/限流**: Upstash Redis (Serverless)
- **认证**: NextAuth.js v5 (Google OAuth + 邮箱验证码)
- **存储**: Cloudflare R2
- **部署**: Cloudflare Pages (Edge Runtime)

## 2. 核心模块

### 2.1 认证 (NextAuth v5)
- **适配器**: `CustomSupabaseAdapter` 直接操作 `wmc_*` 表
- **策略**: JWT Session
- **方式**: Google OAuth (自动验证), 邮箱验证码
- **IP安全**: 使用 Web Crypto API 进行 IP 加盐哈希 (Edge 兼容)

### 2.2 额度与限流系统
- **策略**: 
  - 未验证用户: 3次/月 (IP限制)
  - 验证用户: 10次/月
  - Pro 用户: 无限
- **限流**: 使用 Upstash Redis 实现滑动窗口限流 (`src/lib/rate-limit/upstash.ts`)
- **表**: `wmc_processing_history` (历史记录), `wmc_credit` (额度流水) UI交互支持静默更新。

### 2.3 支付系统 (Creem)
- **服务**: `src/lib/payment/service.ts` (单例模式)
- **表结构**: 
  - `wmc_order`: 支付订单 (snake_case 字段)
  - `wmc_subscription`: 订阅状态 (snake_case 字段)
- **类型安全**: 全面使用 TypeScript Enums (`PaymentStatus`, `PaymentType`, `CreditTransactionScene`)
- **Webhook**: 异步处理充值、续费、订阅变更

### 2.4 图像处理 (Watermark Editor)
- **模型**: `doubao-seedream-4-0-250828`
- **流程**:
  - 首页上传图片 → 自动跳转 `/convert?autoProcess=true` → 自动开始处理
  - 处理中显示遮罩动画("正在生成中...")
  - 完成后显示对比结果
- **特性**:
  - 智能比例识别 (Smart Aspect Ratio) - 默认自动保持原图比例
  - 多分辨率支持 (21:9, 16:9, 1:1, etc.)
  - 4K 超高清输出支持

### 2.5 功能页面架构

所有功能页面遵循统一的架构模式：

| 页面 | 路径 | 主题色 | 说明 |
|------|------|--------|------|
| 去水印 | `/convert` | 默认 | 核心功能，去除水印、Logo、文字 |
| 图片变清晰 | `/unblur` | blue/cyan | 修复模糊照片 |
| 老照片修复 | `/restore` | amber/orange | 修复划痕、上色 |
| 图片降噪 | `/denoise` | emerald/teal | 去除噪点和颗粒感 |
| 去除背景 | `/remove-background` | violet/purple | 创建透明PNG |
| 背景模糊 | `/blur-background` | cyan/sky | 人像模式虚化 |
| 照片上色 | `/colorize` | rose/pink | 黑白照片着色 |
| 图片放大 | `/upscale` | indigo/purple | 无损放大 |

**页面结构**:
```
src/app/[locale]/(default)/[feature]/
├── page.tsx          # Server Component, SEO metadata
└── client.tsx        # Client Component, UI + ComparisonSlider

src/components/[feature]-editor/
└── index.tsx         # Editor组件, 调用 /api/seededit
```

**API 调用**:
- 统一使用 `POST /api/seededit`
- 参数: `feature=[featureName]` 决定使用的提示词
- 提示词配置: `src/lib/prompts.ts`

### 2.6 Demo 图片配置最佳实践

**问题**: 不同功能页面可能需要不同的图片格式（如背景移除输出 PNG，其他页面使用 WebP）

**解决方案**: 在翻译文件中定义完整图片路径，页面组件读取配置

```json
// src/i18n/messages/en.json
{
  "[feature]": {
    "features": {
      "f1_image_before": "/images/demo/xxx-before.png",
      "f1_image_after": "/images/demo/xxx-after.png"
    }
  }
}
```

```tsx
// client.tsx
<ComparisonSlider
  beforeImage={t("features.f1_image_before")}
  afterImage={t("features.f1_image_after")}
  ...
/>
```

**优势**:
- `ComparisonSlider` 组件保持通用，无需修改
- 各页面完全独立，互不干扰
- 可配置任意格式（.png, .webp, .jpg）
- 更换图片格式只需修改翻译文件

### 2.7 其他
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

# Upstash Redis (限流)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# AI 服务
FAL_AI_API_KEY=
ARK_API_KEY=
ARK_API_URL=

# 支付 (Creem)
CREEM_ENABLED=true
CREEM_API_KEY=
CREEM_SIGNING_SECRET=
CREEM_ENVIRONMENT=

# 开发配置
NEXT_PUBLIC_USE_MOCK_API=false  # true=使用模拟API(不消耗额度), false=调用真实AI服务
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
- `wmc_processing_history`: 处理记录 (用于审计和免费用户限额)
- `wmc_order`: 支付订单 (记录交易详情、金额、Provider信息)
- `wmc_subscription`: 订阅状态 (记录周期、状态、续费信息)
- `wmc_credit`: 额度流水 (Grant/Consume 记录)
- `wmc_config`: 系统配置

## 5. 开发规范

- **Lint**: 使用 `npm run lint` 检查代码规范
- **Type Check**: 使用 `npx tsc --noEmit` 检查类型错误
- **Imports**: 优先使用 Absolute Imports (`@/lib/...`)
- **Edge Compatibility**: 避免使用 Node.js 特有 API (如 `crypto`, `fs`)，使用 Web Standard API

## 6. 开发命令

```bash
npm run dev          # 本地开发
npm run build        # 构建
npm run lint         # 代码检查
npm run cf:deploy    # 部署到 Cloudflare Pages
```

---
*Last Updated: 2026-02-09*
