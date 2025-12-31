# WatermarkCleaner 网站架构文档

## 项目概述

**WatermarkCleaner** 是一个现代化的 AI 驱动水印去除网站，提供在线图像处理服务。项目基于 Next.js 15、React 19 和 TypeScript 构建，支持多语言国际化，并提供完整的博客系统、用户认证、额度管理等功能。

**✅ 最新更新**: 2025-12-30 完成数据库架构迁移，将表从 watermarkcleaner schema 迁移到 public schema，统一使用 wmc_ 前缀，确保数据库结构清晰且易于管理。

---

## 1. 技术栈 (Technology Stack)

### 核心技术
- **Next.js**: 15.3.8 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.7.2 (严格模式)
- **Tailwind CSS**: 4.1.4
- **Radix UI**: UI 组件库

### 后端 & 数据库
- **Supabase**: PostgreSQL 数据库 + 认证
- **NextAuth.js**: 4.24.7
- **Prisma**: 数据库 ORM (隐含使用)

### AI & 图像处理
- **Fal.ai**: 主要 AI 图像处理服务 (SDXL Inpainting)
- **ByteDance Ark API**: SeedEdit 模型 (中国市场)
- **OpenAI**: GPT 模型
- **Replicate**: 备用 AI 服务
- **Sharp**: 服务端图像处理库

### 存储 & CDN
- **Cloudflare R2**: S3 兼容对象存储
- **Vercel Edge Network**: CDN 和边缘计算

### 支付系统
- **Stripe**: 订阅和支付处理

### 监控 & 分析
- **Google Analytics**: 流量分析
- **Microsoft Clarity**: 用户行为追踪
- **OpenPanel**: 隐私友好分析
- **Vercel Analytics**: 性能监控

---

## 2. 项目结构 (Project Structure)

```
watermarkcleaner_com/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # 国际化路由
│   │   │   ├── (default)/            # 主应用路由
│   │   │   │   ├── (console)/        # 用户控制台
│   │   │   │   │   ├── my-credits/   # 我的额度
│   │   │   │   │   ├── api-keys/     # API 密钥管理
│   │   │   │   │   ├── orders/       # 订单历史
│   │   │   │   │   └── layouts.tsx
│   │   │   │   ├── convert/          # 水印编辑器页面
│   │   │   │   └── layouts.tsx
│   │   │   │
│   │   │   ├── blog/                 # 博客系统
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # 博客列表
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx      # 博客详情
│   │   │   │       └── client.tsx
│   │   │   │
│   │   │   ├── auth/                 # 认证页面
│   │   │   │   ├── signin/
│   │   │   │   └── signup/
│   │   │   │
│   │   │   ├── pricing/              # 定价页面
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/                      # API 路由
│   │   │   ├── auth/                 # 认证 API
│   │   │   ├── convert/              # 转换 API
│   │   │   ├── credits/              # 额度检查 API
│   │   │   ├── stripe-notify/        # Stripe 通知
│   │   │   ├── upload/               # 文件上传 API
│   │   │   ├── seededit/             # ByteDance AI API
│   │   │   └── inpaint/              # Fal.ai Inpainting API
│   │   │
│   │   ├── sitemap.ts                # 站点地图
│   │   ├── robots.ts                 # robots.txt
│   │   └── middleware.ts             # Next.js 中间件
│   │
│   ├── components/                   # React 组件
│   │   ├── blocks/                   # 页面区块组件
│   │   │   ├── blog/                 # 博客相关组件
│   │   │   ├── editor/               # 编辑器组件
│   │   │   ├── feature/              # 功能展示组件
│   │   │   └── ...
│   │   ├── ui/                       # UI 组件库
│   │   ├── watermark-editor/         # 水印编辑器主组件
│   │   └── auth/                     # 认证组件
│   │
│   ├── lib/                          # 工具库
│   │   ├── blog/                     # 博客相关工具
│   │   ├── credits/                  # 额度管理系统
│   │   ├── storage.ts                # 存储服务
│   │   ├── supabase*.ts              # Supabase 客户端
│   │   ├── auth.config.ts            # 认证配置
│   │   └── utils.ts                  # 通用工具
│   │
│   ├── store/                        # Zustand 状态管理
│   │   └── uploadStore.ts
│   │
│   ├── i18n/                         # 国际化配置
│   │   ├── messages/                 # 翻译文件
│   │   │   ├── en.json               # 英语
│   │   │   └── zh.json               # 中文
│   │   ├── routing.ts                # 路由配置
│   │   └── request.ts                # 请求配置
│   │
│   └── types/                        # TypeScript 类型定义
│
├── content/                          # MDX 内容
│   └── blog/                         # 博客文章
│       ├── post-slug/
│       │   ├── index.json            # 文章元数据
│       │   ├── en.mdx                # 英文内容
│       │   └── zh.mdx                # 中文内容
│
├── public/                           # 静态资源
│   └── images/
│
├── scripts/                          # 工具脚本
│   └── sync-blog-to-db.ts            # 博客同步脚本
│
├── blog-db-setup.sql                 # 博客数据库 schema
├── BLOG_IMPLEMENTATION_SUMMARY.md    # 博客实现总结
└── package.json
```

---

## 3. 核心功能模块 (Core Features)

### 3.1 水印编辑器 (Watermark Editor)

**位置**: `src/app/[locale]/(default)/convert/page.tsx`

**主要组件**:
- `WatermarkEditor` (主编辑器)
- `ImageUploader` (图片上传)
- `ImagePreview` (图片预览)
- `ProcessingOptions` (处理选项)
- `ResultDisplay` (结果展示)

**核心流程**:
1. **上传阶段**: 用户上传图片 (支持 JPEG, PNG, WEBP, GIF)
2. **预览阶段**: 客户端生成预览并显示图片信息
3. **处理阶段**: 调用 AI API 去除水印
   - 自动模式: 智能识别水印区域
   - 保守模式: 避免过度处理
   - 激进模式: 确保完全去除
4. **结果阶段**: 展示对比效果并支持下载

**技术亮点**:
- 多 AI 提供商支持 (Fal.ai, ByteDance Ark)
- 自适应尺寸保持
- 客户端/服务端图像处理结合
- 进度指示和错误处理
- **响应式图片对比组件**: 支持触摸拖拽、自动播放、错误处理、加载状态

### 3.2 博客系统 (Blog System)

**位置**: `src/app/[locale]/blog/`

**架构特点**:
- **内容管理**: 基于文件系统的 MDX 内容存储
- **多语言**: 每篇文章支持中英文版本
- **SEO 优化**: 结构化数据、Meta 标签、站点地图
- **性能**: ISR (增量静态再生) + SSG (静态生成)
- **实时更新**: 内容变更自动生效，无需重新构建
- **简化架构**: 无需数据库，降低维护复杂度

**内容存储结构**:
```
content/
└── blog/
    └── post-slug/
        ├── index.json    # 文章元数据
        ├── en.mdx        # 英文内容
        └── zh.mdx        # 中文内容
```

**核心功能**:
- 博客列表页 (`/blog`)
  - 搜索和筛选
  - 分类和标签
  - 阅读时间计算
  - 精选文章展示
- 博客详情页 (`/blog/[slug]`)
  - 目录导航 (TOC)
  - 相关文章推荐
  - 社交分享
  - 作者信息

**内容管理**:
- **直接编辑**: 修改 MDX 文件直接更新内容
- **自动同步**: 文件变更实时反映到网站
- **版本控制**: Git 追踪所有内容变更
- **AI生成**: 支持 AI 辅助内容创作

**已发布文章**:
1. "2025年7大最佳AI水印去除工具：完整对比"
2. "水印去除的法律问题：2025年您需要了解的事项"
3. "2025年终极指南：如何使用AI技术完美去除图片水印" ⭐

**博客页面优化特性**:
- **视觉设计增强**: 渐变背景、动画效果、现代化排版
- **响应式布局**: 适配移动端、平板、桌面设备
- **交互体验**: 阅读进度条、平滑滚动、返回顶部按钮
- **图片对比组件**: 支持拖拽、自动播放、响应式宽度
- **代码高亮**: 语法高亮、复制按钮、美观样式
- **目录导航**: 自动生成、滚动监听、锚点跳转
- **社交分享**: 多平台分享、SEO优化
- **性能优化**: 懒加载、代码分割、缓存策略

### 3.3 用户认证与授权 (Authentication)

**技术**: NextAuth.js + Supabase Adapter

**认证方式**:
- 邮箱登录 (Magic Link)
- 社交登录 (Google, GitHub - 可扩展)

**用户体系**:
```typescript
enum UserTier {
  unverified = "免费试用",    // 3张/月
  verified = "已验证用户",     // 10张/月
  pro = "专业版"               // 无限
}
```

**会话管理**:
- Cookie 存储
- JWT Token
- RLS 策略

### 3.4 额度管理系统 (Credit System)

**位置**: `src/lib/credits/check.ts`

**核心逻辑**:
- 月度计数周期 (每月1日重置)
- 用户层级控制
- IP-based 限制 (未登录用户)

**检查流程**:
1. 验证用户身份 (session 或 IP)
2. 查询本月使用次数
3. 对比层级限制
4. 处理或拒绝请求

**数据库表**:
- `watermarkcleaner.users`: 用户信息 + 额度记录
- `watermarkcleaner.processing_history`: 处理历史

### 3.5 文件存储 (File Storage)

**服务**: Cloudflare R2

**上传流程**:
```typescript
// src/lib/storage.ts
newStorage().uploadFile({
  body: Buffer,          // 文件内容
  key: "uploads/xxx.jpg", // 存储路径
  contentType: "image/jpeg",
  bucket: "my-bucket"
})
```

**特点**:
- S3 兼容 API
- CDN 加速
- 自动清理策略
- 10MB 文件大小限制

### 3.6 速率限制 (Rate Limiting)

**位置**: `src/lib/rate-limit/`

**策略**:
- IP 级别: 每小时最大请求数
- 用户级别: 每月处理额度
- 窗口限制: 60分钟滑动窗口

**存储**: Upstash Redis (serverless)

---

## 4. API 接口文档 (API Documentation)

### 4.1 通用上传 API

**Endpoint**: `POST /api/upload`

**功能**: 上传文件到存储

**限制**:
- 文件大小: 10MB
- 支持类型: JPG, PNG, WEBP, GIF, PDF, TXT, DOC/DOCX

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "timestamp-random",
    "filename": "original-name.jpg",
    "size": 1024000,
    "type": "image/jpeg",
    "url": "https://cdn.example.com/uploads/xxx.jpg",
    "key": "uploads/xxx.jpg"
  }
}
```

### 4.2 AI 处理 API

#### 4.2.1 Fal.ai Inpainting

**Endpoint**: `POST /api/inpaint`

**参数**:
```typescript
{
  image: File,          // 原图
  mask: File,            // 遮罩 (可选)
  prompt?: string,       // 处理提示词
  originalWidth: number,
  originalHeight: number
}
```

**特点**:
- SDXL Inpainting 模型
- 支持队列模式 (异步)
- 自动尺寸调整

#### 4.2.2 ByteDance SeedEdit

**Endpoint**: `POST /api/seededit`

**功能**: 中国市场的 AI 处理服务

**参数**:
```typescript
{
  image: File,
  mode: "auto" | "conservative" | "aggressive",
  prompt?: string
}
```

**特点**:
- 多处理模式
- 中文优化
- 额度检查集成

### 4.3 额度检查 API

**Endpoint**: `GET /api/credits/check`

**功能**: 检查用户剩余额度

**响应**:
```json
{
  "tier": "verified",
  "used": 5,
  "limit": 10,
  "remaining": 5
}
```

### 4.4 Stripe 支付 API

**Endpoint**: `POST /api/checkout`

**功能**: 创建 Stripe 结账会话

**Endpoint**: `POST /api/stripe-notify`

**功能**: Webhook 处理支付通知

---

## 5. 数据库架构 (Database Schema)

### 5.1 数据库迁移更新 (2025-12-30)

**重要更新**: 已完成数据库表结构迁移，将表从 `watermarkcleaner` schema 迁移到 `public` schema，并统一使用 `wmc_` 前缀。

**迁移内容**:
- `watermarkcleaner.users` → `public.wmc_users`
- `watermarkcleaner.accounts` → `public.wmc_accounts`
- `watermarkcleaner.sessions` → `public.wmc_sessions`
- `watermarkcleaner.verification_tokens` → `public.wmc_verification_tokens`
- `watermarkcleaner.processing_history` → `public.wmc_processing_history`

**迁移过程**:
1. 备份原始数据
2. 创建新表结构（保持原有结构不变）
3. 迁移所有数据
4. 更新代码中的表名引用
5. 验证迁移结果

**相关文件**:
- 迁移脚本: `migration/` 目录下的 SQL 和 JS 文件
- 类型定义: `src/types/database-wmc.types.ts`
- 验证工具: `migration/verify-migration.js`

### 5.2 用户表 (wmc_users)

```sql
CREATE TABLE public.wmc_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  emailVerified TIMESTAMPTZ,
  tier TEXT DEFAULT 'unverified',
  creditsUsed INTEGER DEFAULT 0,
  creditsReset TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 认证相关表 (NextAuth.js)

**wmc_accounts 表**:
```sql
CREATE TABLE public.wmc_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  userId TEXT NOT NULL REFERENCES public.wmc_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**wmc_sessions 表**:
```sql
CREATE TABLE public.wmc_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES public.wmc_users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**wmc_verification_tokens 表**:
```sql
CREATE TABLE public.wmc_verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (identifier, token)
);
```

### 5.4 处理历史表 (wmc_processing_history)

```sql
CREATE TABLE public.wmc_processing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.wmc_users(id) ON DELETE CASCADE,
  ip_address TEXT,
  image_size INTEGER,
  success BOOLEAN,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 国际化 (Internationalization)

**支持语言**: 7 种
- 英语 (en)
- 中文简体 (zh)
- 西班牙语 (es)
- 阿拉伯语 (ar)
- 俄语 (ru)
- 法语 (fr)
- 韩语 (ko)

**实现**: next-intl 4.1.0

**特点**:
- 基于 URL 的路由 (`/en/convert`, `/zh/convert`)
- 动态元数据 (SEO)
- RTL 布局支持 (阿拉伯语)
- 代码分割优化

---

## 7. 性能优化 (Performance)

### 7.1 代码分割
- 动态导入大型组件
- 路由级代码分裂
- Bundle 分析工具集成

### 7.2 图像优化
- Sharp 图像处理
- Next.js Image 组件
- CDN 分发

### 7.3 渲染策略
- 静态生成 (SSG): 博客文章
- 服务器端渲染 (SSR): 动态内容
- 客户端渲染 (CSR): 编辑器界面

### 7.4 缓存策略
- 浏览器缓存: 静态资源
- CDN 缓存: 图像和内容
- Redis 缓存: 速率限制

### 7.5 博客系统性能优化
- **MDX 渲染优化**: 客户端组件按需加载
- **图片对比组件**: 响应式宽度、触摸优化、懒加载
- **CSS 动画**: GPU 加速、will-change 属性
- **移动端性能**: 减少重绘重排、优化触摸响应
- **代码高亮**: 语法高亮缓存、复制功能优化

---

## 8. SEO 与安全 (SEO & Security)

### 8.1 SEO 优化
- **结构化数据**: JSON-LD (Organization, Article, Breadcrumb)
- **Meta 标签**: 动态生成
- **站点地图**: 自动更新
- **规范 URL**: 防重复内容
- **Hreflang**: 多语言 SEO

### 8.2 安全特性
- **CORS 保护**: Next.js 内置
- **内容安全策略**: X-Content-Type-Options
- **XSS 防护**: 输入净化
- **速率限制**: IP 和基于用户
- **文件验证**: 类型和大小限制
- **Row Level Security**: 数据库级别

---

## 9. 部署与 DevOps (Deployment)

### 9.1 构建配置
- **Output**: Standalone (优化容器)
- **分析**: Bundle Analyzer 集成
- **追踪**: 包含内容目录

### 9.2 环境变量
```bash
# 必需环境变量
NEXT_PUBLIC_WEB_URL=https://watermarkcleaner.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
FAL_AI_API_KEY=
ARK_API_KEY=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

### 9.3 部署平台
- **Vercel**: 主部署平台
- **Cloudflare Pages**: 备用方案
- **Docker**: 容器化支持

### 9.4 CI/CD
- **Git**: 版本控制
- **Vercel**: 自动部署
- **TypeScript**: 类型检查
- **ESLint**: 代码质量

---

## 10. 潜在问题与改进建议

### 10.1 性能问题

**问题 1**: AI API 响应时间长
- **影响**: 用户体验差 (超时风险)
- **建议**: 实现 WebSocket 实时进度更新

**问题 2**: 大文件处理
- **影响**: 内存占用高
- **建议**: 流式处理和分块上传

### 10.2 架构改进

**改进 1**: 微服务化
- 将 AI 处理服务独立
- 消息队列 (Redis/RabbitMQ)
- 异步处理模式

**改进 2**: 边缘计算
- Cloudflare Workers
- 边缘缓存策略
- 全球负载均衡

### 10.3 功能增强

**增强 1**: 批处理
- 多图片同时处理
- ZIP 压缩包支持
- 进度追踪

**增强 2**: 高级编辑
- 手动遮罩工具
- 画笔大小调节
- 撤销/重做功能

**增强 3**: 博客系统升级
- 评论系统集成 (如 Giscus)
- 文章点赞/收藏功能
- 相关文章智能推荐
- 作者页面和文章归档
- 文章搜索功能优化

### 10.4 DevOps 优化

**优化 1**: 监控告警
- Sentry 错误追踪
- DataDog 性能监控
- PagerDuty 告警

**优化 2**: 测试覆盖
- 单元测试 (Jest)
- E2E 测试 (Playwright)
- 视觉回归测试

### 10.5 数据库优化

**优化 1**: 索引优化
```sql
-- 添加复合索引
CREATE INDEX idx_processing_history_user_date
ON watermarkcleaner.processing_history(user_id, created_at);

-- 分区表 (按月份)
CREATE TABLE processing_history_2024_12 PARTITION OF processing_history
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

**优化 2**: 缓存策略
- Redis 缓存热门数据
- CDN 缓存静态内容
- 浏览器缓存策略

**优化 3**: 前端性能提升
- 图片懒加载和 WebP 格式
- CSS 和 JS 代码分割
- 关键 CSS 内联
- 字体预加载和优化

---

## 11. 开发指南 (Development Guide)

### 11.1 环境设置

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 11.2 添加新功能

**新 AI 提供商**:
1. 创建 API 路由: `src/app/api/new-ai/route.ts`
2. 实现处理逻辑
3. 更新编辑器界面
4. 添加配置选项

**新博客文章**:
1. 在 `content/blog/` 创建新目录
2. 添加 `index.json` (元数据)
3. 创建 `en.mdx` 和 `zh.mdx`
4. 运行 `npm run sync-blog`

### 11.3 调试技巧

- **日志**: 使用 `console.log` + 环境变量控制
- **测试用户**: 使用 Supabase 本地开发
- **模拟 API**: Mock Service Worker (msw)
- **性能**: Chrome DevTools Performance

---

## 12. 总结

WatermarkCleaner 是一个架构清晰、功能完整的现代化 Web 应用。项目采用前沿技术栈，在 AI 图像处理、国际化、SEO 等方面表现出色。

### 项目架构亮点

**简化内容管理**:
- 基于文件系统的 MDX 内容存储，无需复杂数据库
- 内容变更实时生效，无需重新构建
- Git 版本控制确保内容变更可追踪
- 简化的架构降低维护成本和复杂度

**AI 驱动的内容生成**:
- 支持 AI 辅助创建高质量技术博客
- 保持内容更新频率和质量
- 提升 SEO 效果和搜索引擎排名
- 自动化内容营销增强用户获取

### 项目优势 ✅
- 现代化的 Next.js App Router 架构
- 完善的国际化支持 (7种语言)
- 多 AI 提供商的容错设计 (Fal.ai, ByteDance Ark)
- 完整的博客和内容营销系统 (文件系统存储)
- 健全的额度管理和用户体系 (3-10-无限层级)
- 优秀的 SEO 和性能优化 (ISR + SSG)
- 实时内容更新，无需重新部署

### 改进方向 🔧
- 异步任务队列和实时进度 (WebSocket)
- 端到端测试覆盖 (Playwright)
- 更细粒度的监控和告警 (Sentry, DataDog)
- 高级编辑功能 (手动遮罩工具)
- 批处理和 Bulk 操作优化
- 移动端 App 开发 (React Native)
- AI 内容生成的质量和一致性优化
- 社区功能 (评论、点赞、分享)

---

## 附录

### 相关文档
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Blog Implementation Summary](./BLOG_IMPLEMENTATION_SUMMARY.md)
- [Content/blog Structure](./content/blog/)

### 联系方式
- **项目**: WatermarkCleaner
- **网站**: https://watermarkcleaner.com
- **邮箱**: support@watermarkcleaner.com

---

**文档版本**: 1.2
**最后更新**: 2025-12-30
**维护者**: Claude Code AI

### 更新日志 (Changelog)
- **v1.2 (2025-12-30)**: 完成数据库迁移 - 将表从watermarkcleaner schema迁移到public schema，统一使用wmc_前缀
- **v1.1 (2025-12-29)**: 添加博客页面优化特性、响应式图片对比组件、移动端触摸优化
- **v1.0 (2025-12-25)**: 初始版本，包含完整架构文档
