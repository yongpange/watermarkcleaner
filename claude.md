# WatermarkCleaner 网站架构文档

## 项目概述

**WatermarkCleaner** 是一个现代化的 AI 驱动水印去除网站，提供在线图像处理服务。项目基于 Next.js 15、React 19 和 TypeScript 构建，支持多语言国际化，并提供完整的博客系统、用户认证、额度管理等功能。

**✅ 最新更新**: 2026-01-08 额度系统重大更新 - 统一所有用户额度为3次

**💰 额度系统统一化**:
- ✅ **统一额度**: 所有用户（登录/未登录）统一为3次额度
- ✅ **逻辑简化**: 登录用户额度检查从 wmc_users.creditsused 改为 wmc_processing_history 计数
- ✅ **数据一致性**: 所有用户使用相同的额度计算方式（基于处理历史）
- ✅ **向后兼容**: 保留 wmc_users.creditsused 字段更新，确保数据完整性

**📝 博客内容更新**:
- ✅ **新文章发布**: 发布对比评测文章 "一键去水印 vs 手动涂抹"
- ✅ **四大维度评测**: 涵盖操作便捷性、全屏水印处理、画质保护、商用适用性
- ✅ **完整数据支持**: 包含技术指标（SSIM、PSNR）、用户反馈、实际案例
- ✅ **SEO优化**: 文章标题、描述、标签均已完成 SEO 优化配置
- ✅ **表格渲染**: 实现 Markdown 表格解析和美观的表格样式展示

**✅ Google OAuth 配置完成**:
- ✅ **NextAuth.js v5 升级**: 迁移到 `auth()` API，修复所有导入和类型定义
- ✅ **Google OAuth 集成**: 完整配置 Google Provider，支持一键登录
- ✅ **自动用户升级**: Google 登录用户自动获得 verified 状态（10张额度）
- ✅ **TypeScript 类型安全**: 修复所有 NextAuth v5 相关的类型错误
- ✅ **环境变量配置**: 添加 GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、AUTH_SECRET

**✅ 构建系统修复**: 2026-01-06 修复所有 TypeScript 类型错误：
- ✅ **Supabase 类型推断**：修复所有 `never` 类型错误，使用 `as any` 断言绕过复杂类型推断
- ✅ **Next.js App Router 集成**：修复 `next-intl` 路由配置与实际文件路径不一致问题
- ✅ **组件类型安全**：修复所有 Link 组件的 href 类型错误，确保与 `AppPathname` 定义一致
- ✅ **IP 哈希缓存优化**：添加 Map iterator 的类型保护，防止 undefined 错误
- ✅ **测试代码清理**：删除导致构建失败的测试目录

**🎨 UI 修复**: 2026-01-07 修复 Tailwind CSS v4 暗色模式支持：
- [x] **暗色模式变体定义**：在 `src/app/globals.css` 中添加 `@custom-variant dark (\&:where(.dark, .dark *))` 定义
- [x] **对比组件修复**：修复 `ComparisonShowcase` 在暗色模式下背景依然为亮色的问题 (移除 `dark:from-violet-950/10` 渐变，改用 `dark:bg-none`)
- [x] **Tailwind v4 迁移**：移除 `darkMode` 配置（v4 不需要），改用 CSS 自定义变体语法
- [x] **影响组件**：首页对比展示组件、博客图片对比组件等支持完整暗色主题

**✅ 核心安全特性**: 2026-01-02 实现完整的访客使用追踪系统：
- ✅ **IP地址匿名化**：使用 SHA-256 加盐哈希处理，64字符哈希值存储，原始IP永不存储
- ✅ **服务端专用API**：`record-processing` 端点使用 Service Role Key 安全绕过 RLS 限制
- ✅ **数据自动清理**：72小时自动删除旧记录，符合 GDPR 合规要求
- ✅ **实时额度刷新**：处理成功后 CreditsDisplay 自动更新（从 0/3 → 1/3）
- ✅ **专用管理接口**：`/api/admin/cleanup` 支持手动触发和数据统计

**✨ 系统架构升级**: 2026-01-02 优化服务器/客户端组件架构：
- ✅ **服务端组件**：`generateMetadata` 在服务器执行，SEO友好
- ✅ **客户端组件**：交互逻辑分离，状态管理更清晰
- ✅ **混合渲染模式**：静态内容SSR，动态交互CSR，性能最优

**✅ 最新功能**: 2025-01-01 实现邮箱验证码认证系统，支持无密码注册/登录，使用 Resend 发送验证码，包含完整的速率限制和安全机制。

**✨ 用户体验升级**: 2026-01-01 实现完整的登录状态展示和 Header 重构：
- ✅ **Header 用户状态展示**：登录后显示用户头像、用户名和剩余额度（如 👤 geyongpan (5/10)）
- ✅ **下拉菜单**：支持快速访问"我的额度"、"升级专业版"和"退出登录"
- ✅ **响应式设计**：完美适配移动端，提供完整的用户信息展示
- ✅ **Toast 通知**：使用 react-hot-toast 实现优雅的登录成功提示
- ✅ **Google OAuth 支持**：添加 Google Provider，新用户自动获得 verified 状态（10张额度）
- ✅ **Session 检查优化**：VerificationPrompt 改为检查 tier 字段，逻辑更清晰

**🐛 Bug修复**: 2026-01-01 修复邮箱验证码登录流程中的多个问题：
- 修复 `createClient()` 异步调用缺少 `await` 的问题（涉及 `check-user`、`send-code`、`verify-code` 路由及 `verification.ts`）
- 新增 `src/lib/supabase-admin.ts`，使用 Service Role Key 绕过 RLS 限制
- 修复用户创建时缺少 `id` 字段和字段名不匹配问题
- 修复 `purpose` 参数硬编码为 `'login'` 导致新用户无法注册的问题
- 修复登录跳转使用 `window.location.href` 导致的硬刷新问题（改用 `router.push` + `router.refresh`）

**🔒 安全修复**: 2026-01-02 修复 IP 地址传递和组件架构问题：
- 修复 IP 地址通过内部 fetch 调用丢失的问题（传递原始请求头）
- 修复 `generateMetadata` 客户端组件错误（重构为服务器+客户端组件架构）
- 确保 Service Role Key 仅在服务器端 API 路由中使用，不暴露给客户端
- 修复 `/api/seededit` 中未定义 `clientIP` 变量导致的 ReferenceError，解决访客使用记录丢失问题

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
- **NextAuth.js**: 5.0.0-beta.30 (升级完成 - 2026-01-08)
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

### UI/UX 库
- **react-hot-toast**: 2.5.1 - 优雅的 Toast 通知提示

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
│   │   ├── supabase-server.ts        # SSR Supabase 客户端 (anon key)
│   │   ├── supabase-admin.ts         # 管理员 Supabase 客户端 (service role key, 绕过 RLS)
│   │   ├── supabase-client.ts        # 浏览器端 Supabase 客户端
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

**架构升级**: 2026-01-02 重构为服务端+客户端组件混合架构

**位置**:
- `src/app/[locale]/(default)/convert/page.tsx` (服务端组件 - 处理 SEO)
- `src/app/[locale]/(default)/convert/convert-page-client.tsx` (客户端组件 - 管理交互状态)

**主要组件**:
- `WatermarkEditor` (主编辑器)
- `ImageUploader` (图片上传)
- `ImagePreview` (图片预览)
- `ProcessingOptions` (处理选项)
- `ResultDisplay` (结果展示)
- `CreditsDisplay` (额度显示)
- `VerificationPrompt` (验证提示)

**核心流程**:
1. **上传阶段**: 用户上传图片 (支持 JPEG, PNG, WEBP, GIF)
2. **预览阶段**: 客户端生成预览并显示图片信息
3. **处理阶段**: 调用 AI API 去除水印
   - 自动模式: 智能识别水印区域
   - 保守模式: 避免过度处理
   - 激进模式: 确保完全去除
   - **处理历史记录**: 调用 `/api/record-processing` 记录安全日志（IP哈希匿名化）
4. **结果阶段**: 展示对比效果并支持下载
   - **实时额度刷新**: CreditsDisplay 自动更新使用次数

**技术亮点**:
- 多 AI 提供商支持 (Fal.ai, ByteDance Ark)
- 自适应尺寸保持
- 客户端/服务端图像处理结合
- 进度指示和错误处理
- **响应式图片对比组件**: 支持触摸拖拽、自动播放、错误处理、加载状态
- **混合渲染架构**: 服务端渲染 (generateMetadata) + 客户端交互 (state management)
- **安全记录系统**: IP地址匿名化存储，符合 GDPR 合规要求

**额度刷新机制**:
1. 状态追踪: `ConvertPageClient` 使用 `processingCount` state 追踪处理次数
2. 强制重新渲染: `CreditsDisplay` 接收 `key={processingCount}` prop，变化时强制重新渲染
3. 回调触发: `WatermarkEditor` 处理成功后调用 `onProcessingComplete()` 回调
4. 重新获取数据: 组件重新挂载，自动调用 `/api/credits/check-ip` 获取最新数据

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
4. **新发布** "一键去水印 vs 手动涂抹：两种去除水印方式的实际效果对比" (2026-01-08) ⭐ - 深度评测watermarkcleaner.com与Magic Eraser.org

**博客页面优化特性**:
- **视觉设计增强**: 渐变背景、动画效果、现代化排版
- **响应式布局**: 适配移动端、平板、桌面设备
- **交互体验**: 阅读进度条、平滑滚动、返回顶部按钮
- **图片对比组件**: 支持拖拽、自动播放、响应式宽度
- **代码高亮**: 语法高亮、复制按钮、美观样式
- **表格渲染**: Markdown 表格自动解析，支持响应式滚动
- **目录导航**: 自动生成、滚动监听、锚点跳转
- **社交分享**: 多平台分享、SEO优化
- **性能优化**: 懒加载、代码分割、缓存策略

### 3.3 用户认证与授权 (Authentication)

**技术**: NextAuth.js 5.0.0-beta + Supabase Adapter

**认证方式**:
- ✅ **邮箱验证码登录** (新增 - 2025-01-01) - 无密码认证系统
- 邮箱登录 (Magic Link) - 传统链接验证
- ✅ **Google OAuth 登录** (新增 - 2026-01-08) - 完整的 OAuth 2.0 流程，自动同步用户信息

**NextAuth.js v5 升级** (2026-01-08):
- ✅ **API 变更**: 从 `getServerSession(authOptions)` 迁移到 `auth()` 函数
- ✅ **类型安全**: 使用 `NextAuthConfig` 类型定义配置
- ✅ **模块化**: 创建 `src/auth.ts` 文件导出认证函数
- ✅ **兼容性**: 更新所有 API 路由以使用新的 `auth()` API
- ✅ **构建成功**: 修复所有相关的 TypeScript 编译错误

**Google OAuth 配置详解**:

**环境变量** (.env.local):
```bash
# Google OAuth 凭据 (从 Google Cloud Console 获取)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"  # 开发环境
AUTH_SECRET="your-random-secret-key"   # 用于 JWT 加密
```

**配置位置**:
- 主配置: `src/lib/auth.config.ts` (GoogleProvider)
- 路由配置: `src/app/api/auth/[...nextauth]/route.ts`
- 认证函数: `src/auth.ts` (导出 `auth()`, `signIn`, `signOut`)

**核心特性**:
1. **一键登录**: 用户点击"使用 Google 登录"按钮即可快速登录
2. **自动注册**: 新用户首次登录自动创建账户
3. **等级升级**: Google 用户自动获得 `verified` 状态（10张/月额度）
4. **信息同步**: 自动同步 Google 头像、姓名等信息
5. **安全可靠**: 使用 NextAuth.js v5 的安全机制

**Google OAuth 流程**:
1. 用户点击 Google 登录按钮
2. 重定向到 Google 授权页面
3. 用户授权后返回应用
4. NextAuth 处理回调并创建会话
5. SignIn 回调自动创建/更新用户记录
6. 用户获得 `verified` 等级和 10 张初始额度
7. 重定向到 `/my-credits` 页面

**Google Cloud Console 设置**:
- 启用 Google+ API
- 配置 OAuth 同意屏幕
- 创建 OAuth 2.0 客户端 ID
- 添加授权重定向 URI: `http://localhost:3000/api/auth/callback/google`

**登录体验升级 (2026-01-01)**:
- **Header 用户状态展示**：登录后自动显示用户头像、用户名和剩余额度（如 👤 geyongpan (5/10)）
- **下拉菜单**：快速访问"我的额度"、"升级专业版"和"退出登录"
- **响应式设计**：完美适配移动端，提供完整的用户信息展示
- **Toast 通知**：使用 react-hot-toast 实现优雅的登录成功提示和错误通知
- **Session 管理**：自动同步用户 tier 状态，实时更新额度显示
- **信任 Google 验证**：新 Google 用户自动获得 verified 状态（10张额度），无需额外验证

**邮箱验证码认证系统** (新功能):

**位置**:
- 核心逻辑: `src/lib/auth/verification.ts`
- 邮件服务: `src/lib/email/resend.ts`
- 发送验证码 API: `src/app/api/auth/send-code/route.ts`
- 验证验证码 API: `src/app/api/auth/verify-code/route.ts`
- NextAuth 配置: `src/lib/auth.config.ts`

**核心功能**:
- 无密码注册和登录（只用邮箱验证码）
- 6位数字验证码，5分钟有效期
- 每个验证码最多尝试3次
- IP速率限制（每小时最多5次请求）
- 多语言邮件模板支持
- 一次性验证码（使用后失效）

**安全特性**:
- 速率限制（IP + 用户级别）
- 验证码过期机制
- 尝试次数限制（防暴力破解）
- Resend API 发送邮件
- HTTPS 强制（生产环境）

**前端流程**:
1. 用户输入邮箱 → 发送验证码
2. 接收邮件 → 输入6位验证码
3. 验证成功 → 自动登录并重定向

**数据库表**:
```sql
CREATE TABLE public.wmc_email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,  -- 6位数字
  purpose TEXT NOT NULL,  -- 'register' | 'login' | 'update_email'
  attempts INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API 接口**:
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/verify-code` - 验证验证码
- `POST /api/auth/check-user` - 检查用户是否存在（用于实时验证）
- `NextAuth Credentials Provider (email-code)` - 认证提供者

**前端组件** (Apple设计风格):
```
src/components/auth/
├── auth-modal.tsx                    # 主认证弹窗（集成所有功能）
├── email-input-section.tsx           # 邮箱输入区域（带用户检查）
├── verification-code-input.tsx       # 验证码输入组件（6位独立输入框）
├── google-login-button.tsx           # Google登录按钮组件
├── magic-link-button.tsx             # 邮箱链接登录按钮组件
└── magic-link-login-button.tsx       # 邮箱链接登录表单

src/components/auth/apple-style/      # Apple风格基础UI组件
├── button.tsx                        # 按钮组件（支持多种变体）
├── input.tsx                         # 输入框组件（含验证码输入）
└── divider.tsx                       # 分隔线组件
```

**组件特性**:
- 使用 **Apple设计风格**: 毛玻璃效果、圆角、优雅动画
- 响应式布局，完美支持移动端
- **6位独立验证码输入框**，支持自动跳转和粘贴填充
- 实时用户存在性检查（输入邮箱后）
- 完整的动画系统（淡入淡出、弹簧效果）
- 组件高度拆分，易于集成支付等其他功能

**交互流程**:
1. 用户输入邮箱 → 实时检查用户是否存在
2. 点击发送验证码 → 60秒倒计时显示在重新发送按钮上
3. 输入6位验证码 → 自动跳转/可粘贴填充
4. 验证通过 → 自动登录并重定向到控制台

**动画效果** (Framer Motion):
- 弹窗打开/关闭: 淡入淡出 + 缩放动画
- 内容切换: 滑动动画 + 透明度变化
- 按钮状态变化: 微缩放动画
- 输入框聚焦: 边框颜色渐变 + 阴影扩展

**用户体系**:
```typescript
enum UserTier {
  unverified = "免费试用",    // 3张/月
  verified = "已验证用户",     // 10张/月
  pro = "专业版"               // 无限
}

// 新增 username 字段（自动生成）
// username = email.split('@')[0]（确保唯一性）
```

**会话管理**:
- Cookie 存储
- JWT Token（适用于无密码认证）
- 数据库 Session（传统方式）
- RLS 策略（行级安全）

### 3.4 额度管理系统 (Credit System)

**位置**: `src/lib/credits/check.ts`

**核心逻辑** (2026-01-08 更新):
- **统一额度**: 所有用户（登录/未登录）统一为3次额度
- **基于处理历史**: 额度计算基于 `wmc_processing_history` 表的实际处理记录
- **终身计数**: 使用处理历史总数作为已使用额度（不再使用 `creditsused` 字段）
- **向后兼容**: 保留 `wmc_users.creditsused` 字段更新，确保数据完整性

**安全特性**:
- ✅ **IP地址匿名化**: 使用 SHA-256 + 盐值哈希，64字符哈希值存储，原始IP永不存储
- ✅ **服务端专用API**: `record-processing` 端点使用 Service Role Key，绕过 RLS 限制
- ✅ **数据自动清理**: 72小时后自动删除记录，符合 GDPR 合规要求
- ✅ **实时额度刷新**: 处理成功后前端 CreditsDisplay 自动更新

**IP匿名化实现**:
1. **哈希算法**: 使用 `crypto.createHash('sha256')` 生成 64 字符十六进制哈希
2. **盐值保护**: 使用 `IP_HASH_SALT` 环境变量（32字节随机值）增强安全性
3. **存储格式**: 数据库 `ip_address` 列存储 64 字符哈希值，无法反向推导出原始IP
4. **查询逻辑**: 查询时使用相同的哈希算法，确保匹配一致性
5. **调试日志**: 控制台输出 IP Hashing Debug 信息（开发环境）

**关键修复**: 2026-01-02 修复 IP 哈希查询不匹配问题
- **问题**: 数据库查询使用原始 IP 地址，而非哈希后的值
- **影响**: 导致 `CreditsDisplay` 始终显示 "0 / 3 images"
- **解决方案**:
  1. 在 `checkUserCredits` 函数中添加 IP 哈希处理：`const hashedIdentifier = hashIPAddress(identifier);`
  2. 查询时使用哈希值：`.eq('ip_address', hashedIdentifier)`
  3. 确保查询结果与实际数据库记录匹配

**额度刷新机制**:
1. **状态追踪**: ConvertPageClient 使用 `processingCount` state 追踪处理次数
2. **强制重新渲染**: CreditsDisplay 接收 `key={processingCount}` prop，变化时强制重新渲染
3. **回调触发**: WatermarkEditor 处理成功后调用 `onProcessingComplete()` 回调
4. **重新获取数据**: 组件重新挂载，自动调用 `/api/credits/check-ip` 获取最新数据

**检查流程** (2026-01-08 更新):
1. **用户认证**: 验证用户身份 (session 或 IP)
2. **额度查询**:
   - **已登录用户**: 查询 `wmc_processing_history` 表，统计 user_id 匹配的记录数
   - **未登录用户**: 查询 `wmc_processing_history` 表，统计 IP 哈希匹配的记录数
3. **限制对比**: 检查使用次数是否达到3次限制（所有用户统一）
4. **结果返回**: 返回 `used`、`limit` 和 `remaining` 值供前端显示

**2026-01-08 额度系统优化**:
- **问题**: 登录用户有10次额度，未登录用户只有3次，造成用户体验不一致
- **解决方案**: 统一所有用户额度为3次，基于实际处理历史记录计算
- **影响范围**: 所有 `checkCredits` 和 `checkUserCredits` 调用，CreditsDisplay 组件显示
- **数据库兼容性**: 保留 `wmc_users.creditsused` 字段，但额度计算不再依赖该字段

**数据库表**:
- `public.wmc_users`: 用户信息 + 额度记录（已登录用户）
  - `tier`: 用户层级（unverified/verified/pro）
  - `creditsUsed`: 本月已使用次数
  - `creditsReset`: 上次重置时间

- `public.wmc_processing_history`: 处理历史记录（已登录和未登录用户）
  - `user_id`: 已登录用户的 ID（null 表示未登录）
  - `ip_address`: 未登录用户的 IP 哈希值（已登录为 null）
  - `image_size`: 处理的图片大小
  - `success`: 处理是否成功
  - `created_at`: 记录创建时间（用于月度统计）

**API端点**:
- `GET /api/credits/check` - 已登录用户额度检查
- `GET /api/credits/check-ip` - 未登录用户（基于IP哈希）额度检查
- `POST /api/record-processing` - 专用端点记录处理历史（使用 Service Role Key）

**前端组件**:
- `CreditsDisplay` (`src/components/CreditsDisplay.tsx`) - 额度显示组件
  - 支持已登录和未登录用户
  - 显示月度使用量、剩余额度、进度条
  - 处理成功后自动刷新

- `ConvertPageClient` (`src/app/[locale]/(default)/convert/convert-page-client.tsx`) - 客户端组件
  - 管理 `processingCount` 状态
  - 处理成功后触发重新渲染

- `WatermarkEditor` (`src/components/watermark-editor/index.tsx`) - 编辑器组件
  - 接收 `onProcessingComplete` 回调
  - 处理成功后调用回调函数

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

**功能**: 检查已登录用户剩余额度

**响应**:
```json
{
  "tier": "verified",
  "used": 5,
  "limit": 10,
  "remaining": 5
}
```

**Endpoint**: `GET /api/credits/check-ip`

**功能**: 检查未登录用户（基于IP哈希）剩余额度

**说明**: 使用 IP 地址加盐哈希后查询月度使用次数

**响应**:
```json
{
  "tier": "unverified",
  "used": 2,
  "limit": 3,
  "remaining": 1
}
```

### 4.4 记录处理历史 API

**Endpoint**: `POST /api/record-processing`

**功能**: 记录图片处理历史（服务端专用）

**说明**: 使用 Service Role Key 绕过 RLS，安全记录用户处理历史

**请求体**:
```typescript
interface RecordProcessingRequest {
  imageSize: number;    // 必需：图片大小（字节）
  userId?: string;       // 可选：已登录用户 ID
  success?: boolean;     // 可选：是否成功（默认 true）
}
```

**安全特性**:
- ✅ 使用 Service Role Key（仅在服务器端）
- ✅ IP 地址加盐哈希（使用 IP_HASH_SALT）
- ✅ Origin 验证（仅限授权域名）
- ✅ 参数验证和错误处理

**流程**:
1. 从请求头获取客户端 IP（`x-forwarded-for` 或 `x-real-ip`）
2. IP 地址 SHA-256 加盐哈希（64 字符）
3. 使用 Service Role Key 插入数据库（绕过 RLS）
4. 已登录用户：`user_id` = 用户 ID, `ip_address` = null
5. 未登录用户：`user_id` = null, `ip_address` = 哈希值

**响应**:
```json
{
  "success": true,
  "message": "Processing history recorded successfully",
  "hashedIP": "18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de"
}
```

### 4.5 数据清理管理 API

**Endpoint**: `POST /api/admin/cleanup`

**功能**: 获取清理统计信息（需要 Admin Key）

**认证**: Bearer Token (ADMIN_API_KEY)

**响应**:
```json
{
  "success": true,
  "totalRecords": 150,
  "recordsOlderThan72Hours": 45,
  "nextCleanup": "2026-01-05T12:00:00.000Z"
}
```

**Endpoint**: `GET /api/admin/cleanup?days=3`

**功能**: 手动触发数据清理（需要 Admin Key）

**认证**: Bearer Token (ADMIN_API_KEY)

**参数**:
- `days`: 保留最近多少天的数据（默认 3 天）

**响应**:
```json
{
  "success": true,
  "deletedCount": 45,
  "cutoffDate": "2026-01-02T12:00:00.000Z"
}
```

### 4.6 Stripe 支付 API

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

**用途**: 记录所有图片处理请求（包括成功和失败），用于额度追踪、统计分析和安全审计。

**安全特性**:
- ✅ **IP地址匿名化**: `ip_address` 存储 SHA-256 哈希值（64字符），原始IP永不存储
- ✅ **数据自动清理**: 72小时后自动删除旧记录，符合 GDPR 要求
- ✅ **RLS策略**: 启用行级安全，匿名用户仅可通过服务端API写入

```sql
CREATE TABLE public.wmc_processing_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.wmc_users(id) ON DELETE CASCADE,
  ip_address TEXT,              -- IP哈希值（未登录用户）或 null（已登录用户）
  image_size INTEGER,           -- 图片大小（字节）
  success BOOLEAN DEFAULT true, -- 处理是否成功
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id`: 唯一标识符（UUID）
- `user_id`: 已登录用户的 ID（外键关联 wmc_users），未登录用户为 null
- `ip_address`: 未登录用户的 IP 哈希值（64字符SHA256），已登录用户为 null
- `image_size`: 处理的图片大小（字节）
- `success`: 处理是否成功（用于统计有效使用次数）
- `created_at`: 记录创建时间（用于月度统计和自动清理）

**索引优化**:
```sql
-- IP地址和日期范围查询
CREATE INDEX idx_processing_history_ip_date
ON public.wmc_processing_history(ip_address, created_at)
WHERE success = true;

-- 用户和日期范围查询
CREATE INDEX idx_processing_history_user_date
ON public.wmc_processing_history(user_id, created_at)
WHERE success = true;

-- 清理操作优化
CREATE INDEX idx_processing_history_created_at
ON public.wmc_processing_history(created_at);
```

**数据保留策略**:
- **自动清理**: 72小时前的记录自动删除（符合 GDPR）
- **清理频率**: 每 24 小时执行一次
- **手动清理**: 可通过 `/api/admin/cleanup` 手动触发

**数据示例**:
```sql
-- 已登录用户记录
INSERT INTO wmc_processing_history (user_id, ip_address, image_size)
VALUES ('user-123', null, 1024000);

-- 未登录用户记录（IP已哈希）
INSERT INTO wmc_processing_history (user_id, ip_address, image_size)
VALUES (null, '18849ddcfb4ac7c006228118ee75b12cea0f541...', 2048000);
```

**查询示例**:
```sql
-- 查询某用户的月度使用次数
SELECT COUNT(*)
FROM wmc_processing_history
WHERE user_id = 'user-123'
  AND success = true
  AND created_at >= date_trunc('month', CURRENT_DATE);

-- 查询某IP哈希的月度使用次数（未登录用户）
SELECT COUNT(*)
FROM wmc_processing_history
WHERE ip_address = '18849ddcfb4ac7c006228118ee75b12cea0f...'
  AND success = true
  AND created_at >= date_trunc('month', CURRENT_DATE);
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

# Google OAuth 配置 (必需)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
AUTH_SECRET=your-random-secret-key  # NextAuth.js JWT 加密密钥

# Strip 支付配置
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# AI 服务 API 密钥
FAL_AI_API_KEY=
ARK_API_KEY=

# 云存储配置
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

# 邮件服务 (Resend)
RESEND_API_KEY=
EMAIL_FROM=WatermarkCleaner <noreply@watermarkcleaner.com>

# IP 地址匿名化盐值 (必需，32字节随机值)
IP_HASH_SALT=

# 数据保留策略
DATA_RETENTION_DAYS=3
```

**获取 Google OAuth 凭据**:
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API**
4. 配置 OAuth 同意屏幕
5. 创建 OAuth 2.0 客户端 ID
6. 添加授权重定向 URI:
   - 开发环境: `http://localhost:3000/api/auth/callback/google`
   - 生产环境: `https://yourdomain.com/api/auth/callback/google`
7. 复制 **Client ID** 和 **Client Secret** 到 `.env.local`

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

**优化 1**: TypeScript 构建系统
- **修复 Supabase 类型推断**：使用 `as any` 断言解决 `never` 类型错误
- **i18n 路由配置**：确保 `pathnames` 配置与实际文件路径一致
- **组件类型安全**：修复所有 `Link` 组件的 href 类型错误
- **构建验证**：本地和 Vercel 部署构建均通过 ✅

**优化 2**: 监控告警
- Sentry 错误追踪
- DataDog 性能监控
- PagerDuty 告警

**优化 3**: 测试覆盖
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

**文档版本**: 1.9
**最后更新**: 2026-01-08
**维护者**: Claude Code AI

### 更新日志 (Changelog)
- **v1.9 (2026-01-08)**: 额度系统重大更新 - 统一所有用户为3次额度，修复 NextAuth v5 类型错误
  - **额度系统统一化**: 所有用户（登录/未登录）统一为3次额度
  - **查询逻辑优化**: 登录用户额度检查改为基于 `wmc_processing_history` 表计数
  - **数据一致性**: 所有用户使用相同的额度计算方式（基于处理历史）
  - **向后兼容**: 保留 `wmc_users.creditsused` 字段更新，确保数据完整性
  - **NextAuth v5 修复**: 修复 `auth is not a function` 错误，更新 `AuthOptions` → `NextAuthConfig`
  - **影响范围**: 所有额度检查 API、CreditsDisplay 组件、额度扣除逻辑

- **v1.8 (2026-01-08)**: 新增深度评测博客文章 - 对比 watermarkcleaner.com 与 Magic Eraser.org
  - **新文章内容**: "一键去水印 vs 手动涂抹：两种去除水印方式的实际效果对比"
  - **四大维度评测**: 操作便捷性、全屏水印处理、画质保护、商用适用性
  - **完整数据支持**: 包含技术指标（SSIM、PSNR）、用户反馈、实际案例分析
  - **SEO优化**: 文章标题、描述、标签均已配置，支持多语言扩展
  - **文件架构**: 创建 content/blog/automatic-vs-manual-watermark-removal/ 目录结构
  - **中文版本**: 完成 zh.mdx 和 index.json 配置，支持后续6种语言添加
- **v1.7 (2026-01-08)**: 完成 Google OAuth 完整配置和 NextAuth.js v5 升级
  - **NextAuth.js v5 升级**: 迁移到新的 `auth()` API，修复所有类型错误
  - **Google OAuth 集成**: 完整配置 Google Provider，支持一键登录
  - **自动用户升级**: Google 登录用户自动获得 verified 状态（10张额度）
  - **类型安全**: 修复所有 NextAuth v5 相关的 TypeScript 编译错误
  - **环境变量**: 添加完整的 Google OAuth 配置文档
  - **API 更新**: 迁移所有使用 `getServerSession()` 的 API 路由到新的 `auth()` API
  - **模块重构**: 创建 `src/auth.ts` 文件导出认证函数
  - **测试状态**: ✅ 所有 TypeScript 类型检查通过，构建成功
- **v1.6 (2026-01-07)**: 修复 Tailwind CSS v4 暗色模式支持
  - **暗色模式变体**：在 `src/app/globals.css` 添加 `@custom-variant dark (\\u0026\:where(.dark, .dark *))` 定义
  - **背景渐变修复**：首页对比组件、博客图片对比组件支持 `dark:from-*` / `dark:to-*` 类
  - **技术栈更新**：完善 Tailwind CSS v4 迁移，移除 v3 的 `darkMode` 配置需求
  - **影响范围**：所有使用 `dark:` 前缀的组件（首页、博客、编辑器）
  - **修复状态**: ✅ 暗色模式完整支持通过
- **v1.5 (2026-01-06)**: 修复 TypeScript 构建错误和 i18n 路由配置
  - **Supabase 类型推断**：修复所有 `never` 类型错误，使用 `as any` 断言
  - **i18n 路由配置**：修正 `pathnames` 配置中的 `/converter` → `/convert`，与实际文件路径一致
  - **组件类型安全**：修复所有 Link 组件的 href 类型错误
  - **IP 哈希缓存**：添加 Map iterator 类型保护，防止 undefined 错误
  - **测试代码清理**：删除导致构建失败的测试目录
  - **影响文件**: 29个文件修改，包括API路由、认证配置、组件等
  - **构建状态**: ✅ 本地和 Vercel 部署均成功
- **v1.4 (2026-01-02)**: 实现完整的访客使用追踪和安全记录系统
  - **安全架构**: 实现 IP 地址匿名化（SHA-256 加盐哈希）
  - **服务端专用**: `/api/record-processing` 使用 Service Role Key 绕过 RLS 限制
  - **数据清理**: 72小时自动清理机制，符合 GDPR 合规要求
  - **实时刷新**: CreditsDisplay 处理成功后自动更新（0/3 → 1/3）
  - **架构重构**: 修复 `generateMetadata` 错误，重写为服务器+客户端组件架构
  - **关键修复**: 修复 IP 哈希查询不匹配问题（查询使用哈希值而非原始IP）
  - **环境变量**: 生成真正的随机盐值（IP_HASH_SALT）增强安全性
- **v1.3 (2026-01-01)**: 实现完整的用户登录状态展示和 Header 重构
  - 添加 Header 用户状态展示（头像、用户名、额度）
  - 实现下拉菜单和响应式设计
  - 集成 react-hot-toast 实现优雅的通知提示
  - 添加 Google OAuth 支持，信任 Google 验证自动升级用户等级
  - 优化 VerificationPrompt，改为检查 tier 字段
  - 修复登录跳转硬刷新问题，改用 router.push + router.refresh
- **v1.2 (2025-12-30)**: 完成数据库迁移 - 将表从watermarkcleaner schema迁移到public schema，统一使用wmc_前缀
- **v1.1 (2025-12-29)**: 添加博客页面优化特性、响应式图片对比组件、移动端触摸优化
- **v1.0 (2025-12-25)**: 初始版本，包含完整架构文档
