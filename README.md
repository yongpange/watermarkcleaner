# WatermarkCleaner

> 从带水印的图片到可下载的成片：给需要在线去水印和修图的人一个网站

---

## 🎯 项目说明

WatermarkCleaner 是 [watermarkcleaner.com](https://watermarkcleaner.com) 的网站。用户上传 JPG、PNG、WEBP 图片后，可以去水印，也可以做变清晰、老照片修复、降噪、去背景、背景虚化、上色和放大。界面有英文、中文、西班牙文、阿拉伯文、俄文、法文、韩文。

| 版本 | 功能 | 状态 | 文档 |
|-----|------|------|------|
| **V1 在线修图** | 去水印和 7 个修图功能、登录、额度与支付 | ✅ 已完成 | [架构说明](claude.md) |
| **V1.0.2** | 清掉调试笔记和一次性脚本，补上仓库入口说明 | ✅ 已完成 | [本文件](README.md) |
| **V1.0.3** | 补上 Features 菜单里放大图片缺失的图标 | ✅ 已完成 | [本文件](README.md) |
| **V1.0.4** | 博客改成统一的阅读排版，菜单改成编号短列表 | ✅ 已完成 | [本文件](README.md) |

---

## 🚀 快速开始

### 环境要求

- Node.js 20+
- 项目根目录的 `.env.local`：`NEXT_PUBLIC_WEB_URL` 给站点地址，本地是 `http://localhost:3000`
- `NEXT_PUBLIC_SUPABASE_URL` 给 Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 给 Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` 给 Supabase 服务端密钥
- `AUTH_SECRET` 给登录会话签名
- `ARK_API_KEY` 给图像处理接口，去水印和修图时需要
- `IP_HASH_SALT` 给访客 IP 哈希
- 支付再看 `.env.local.example`：`CREEM_ENABLED`、`CREEM_API_KEY`、`CREEM_SIGNING_SECRET`、`CREEM_ENVIRONMENT`

### 安装

在项目根目录执行：

```powershell
npm install
Copy-Item .env.example .env.local
```

复制之后，把上面列出的变量填进 `.env.local`。`.env.example` 里没有 `SUPABASE_SERVICE_ROLE_KEY` 和 `ARK_API_KEY`，这两项需要自己补上。

### 启动开发服务器

在项目根目录执行：

```powershell
npm run dev
```

终端出现 `Local: http://localhost:3000` 后，浏览器打开这个地址。

访问：**http://localhost:3000**

没写 `.env.local` 时首页仍能打开。点击去水印或登录时，接口会因为缺少 Supabase 或 `ARK_API_KEY` 失败。

`npm run start` 在 PowerShell 里不能用。这条脚本写成了 `NODE_NO_WARNINGS=1 next start`，PowerShell 会把它当成命令名。本地开发用 `npm run dev`。

---

## 📁 项目结构

```
watermarkcleaner/
├── README.md                  # 本文件（项目入口）
├── claude.md                  # 架构说明
├── package.json               # 依赖和命令
├── next.config.mjs            # Next.js 配置：多语言、MDX、安全响应头
├── wrangler.toml              # Cloudflare Pages 部署配置
├── Dockerfile                 # 容器构建
├── .env.example               # 环境变量模板
├── content/blog/              # 多语言 MDX 博客
├── public/                    # 图片和静态资源
├── scripts/prebuild-blog.js   # 构建前把博客编译成 JSON
├── supabase/migrations/       # 数据库迁移
└── src/
    ├── app/                   # 页面和 API
    ├── components/            # 界面和各功能编辑器
    ├── lib/                   # 认证、额度、支付、提示词
    ├── i18n/                  # 多语言文案
    └── models/                # 数据读写
```

---

## 📖 文档导航

### 开发者文档

| 文档 | 说明 |
|-----|------|
| [架构说明](claude.md) | 技术栈、认证、额度、支付和图像处理流程 |

---

## ⚙️ 常用命令

```powershell
# 安装依赖
npm install

# 启动开发服务器（会先编译博客）
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 生产构建
npm run build

# 构建并部署到 Cloudflare Pages
npm run cf:deploy
```

---

## 🔮 项目演进

```
V1 在线修图 ✅（已完成）
    ↓ 清掉调试残留并补上入口说明
V1.0.2 仓库入口 ✅（已完成）
    ↓ 菜单图标和文案对齐
V1.0.3 菜单图标 ✅（已完成）
    ↓ 文章页和博客菜单按同一套阅读排版收干净
V1.0.4 博客排版 ✅（已完成）
```

---

## 📝 许可证

MIT

---

## 📧 联系方式

如有问题或建议，请联系 binggua666@gmail.com，或提交 Issue 或 Pull Request。

---

**最后更新**：2026-10-10
