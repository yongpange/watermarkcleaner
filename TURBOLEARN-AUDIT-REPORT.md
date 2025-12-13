# Turbolearn 关键词全面审查报告

**审查日期**: 2025-12-13
**审查工具**: Claude Code
**审查范围**: 全站代码库
**总计发现**: 38个文件包含 "turbolearn" 关键词，约200+处引用

---

## 📋 内容分类总览

| 类别 | 文件数量 | 主要内容类型 |
|------|----------|--------------|
| 配置文件 | 3 | 环境变量、构建脚本|
| 国际化文件 | 24 | 多语言翻译内容 |
| 法律文档 | 2 | 服务条款、隐私政策 |
| 源代码文件 | 6 | URL链接、文本内容 |
| 模板文件 | 3 | 产品名称定义 |

---

## 🔴 必须处理的核心内容

### 1. 配置文件

#### 1.1 .env.example
- **位置**: `/.env.example`
- **内容类型**: 环境变量
- **具体内容**: `NEXT_PUBLIC_PROJECT_NAME = "TurboLearn"`
- **影响范围**: 整个应用的基础项目名称

**处理建议**:
1. **建议删除**: 完全删除此行（如果有应用名称需求，使用WatermarkCleaner）
2. **建议替换**: `NEXT_PUBLIC_PROJECT_NAME = "WatermarkCleaner"`

---

#### 1.2 package.json
- **位置**: `/package.json`
- **内容类型**: 构建脚本
- **具体内容**: `"docker:build": "docker build -f Dockerfile -t turbolearn-template-one:latest ."`
- **影响范围**: Docker构建命令

**处理建议**:
1. **建议删除**: 删除整个docker:build脚本（如果不使用Docker）
2. **建议替换**: `"docker:build": "docker build -f Dockerfile -t watermarkcleaner:latest ."`

---

#### 1.3 wrangler.toml.example
- **位置**: `/wrangler.toml.example`
- **内容类型**: Cloudflare Workers配置
- **具体内容**: `name = "turbolearn-template-one"`
- **影响范围**: Cloudflare部署

**处理建议**:
1. **建议删除**: 完全删除此文件（如果不使用Cloudflare Workers）
2. **建议替换**: `name = "watermarkcleaner"`

---

### 2. 多语言国际化文件（i18n）

#### 2.1 元数据文件（全局影响）

**文件**: `src/i18n/messages/en.json`
- **行 3-6**: 页面标题、描述、关键词（影响首页SEO）
- **处理建议**: 完全重写为WatermarkCleaner相关内容

**文件**: `src/i18n/messages/zh.json`
- **行 3-6**: 中文页面标题、描述、关键词
- **处理建议**: 完全重写为WatermarkCleaner中文内容

**文件**: `src/i18n/messages/ru.json`
- **行 3-6**: 俄语页面标题、描述、关键词
- **行 85**: `"description": "Новости, ресурсы и обновления о TurboLearn"`
- **行 87**: `"hero_title": "Блог TurboLearn"`
- **行 117**: `"rating_tip": "Что вы думаете о TurboLearn?"`
- **处理建议**: 全部替换为WatermarkCleaner相关内容

**文件**: `src/i18n/messages/ar.json`
- **行 3-6**: 阿拉伯语页面元数据
- **行 85**: 博客描述包含TurboLearn
- **行 87**: 博客标题包含TurboLearn
- **行 117**: 评分提示包含TurboLearn
- **处理建议**: 全部替换

**文件**: `src/i18n/messages/ko.json`
- **行 3-6**: 韩语页面元数据
- **行 85**: TurboLearn博客描述
- **行 87**: TurboLearn博客标题
- **行 117**: TurboLearn评分提示
- **处理建议**: 全部替换

**文件**: `src/i18n/messages/es.json`
- **行 3-6**: 西班牙语页面元数据
- **行 85**: TurboLearn博客描述
- **行 87**: TurboLearn博客标题
- **行 117**: TurboLearn评分提示
- **处理建议**: 全部替换

**文件**: `src/i18n/messages/fr.json`
- **行 3-6**: 法语页面元数据
- **行 85**: TurboLearn博客描述
- **行 87**: TurboLearn博客标题
- **行 117**: TurboLearn评分提示
- **处理建议**: 全部替换

---

#### 2.2 定价页面翻译

**文件**: 多语言定价文件（en/zh/ru/ko/es/fr/ar.json）
- **产品名称行**: 37, 71, 103
- **具体内容**:
  - `TurboLearn Starter`
  - `TurboLearn Standard`
  - `TurboLearn Premium`
  - `TurboLearn 入门版` (中文)
  - `TurboLearn 스타터` (韩语)
  - etc.

**处理建议**:
1. **建议删除**: 删除这些产品名称行（如果不需要分级产品）
2. **建议替换**:
   - `WatermarkCleaner Starter`
   - `WatermarkCleaner Standard`
   - `WatermarkCleaner Premium`
   - `WatermarkCleaner 入门版`
   - `WatermarkCleaner 스타터` etc.

---

#### 2.3 展示页面翻译

**文件**: `src/i18n/pages/showcase/*.json`（所有语言）
- **行 4**: 所有语言版本都有相同内容
- **具体内容**:
  - 英文: `"title": "AI SaaS Startups built with TurboLearn"`
  - 中文: `"title": "使用 TurboLearn 构建的 AI SaaS 创业项目"`
  - 俄语: `"title": "Стартапы SaaS с ИИ, построенные с TurboLearn"`
  - 其他语言类似...

**处理建议**:
1. **建议删除**: 删除整个showcase功能模块（如果不展示客户案例）
2. **建议替换**:
   - `AI SaaS Solutions powered by WatermarkCleaner Technology`
   - `使用 WatermarkCleaner 技术构建的 AI SaaS 解决方案`
   - `Решения SaaS с ИИ на базе технологии WatermarkCleaner`

---

#### 2.4 着陆页翻译（Landing Page）

**文件**: `src/i18n/pages/landing/[语言].json`（俄语、韩语、法语示例）

**俄语版本 (ru.json)**:
- **行 2**: `"template": "turbolearn-template-one"`
- **行 6**: Hero区域标题 `"TurboLearn"`
- **行 9**: Hero图片alt文本 `"TurboLearn - Бесплатная альтернатива Quizlet"`
- **行 51**: 页面标题 `"TurboLearn: Бесплатная альтернатива Quizlet с ИИ"`
- **行 75**: 功能区域标题
- **行 77**: 功能区域描述
- **行 101**: 对比区域标题 `"TurboLearn против Quizlet"`
- **行 103-107**: 对比内容大量提及TurboLearn
- **行 133**: 开始指南标题
- **行 221**: CTA区域描述
- **行 226-244**: 用户评价内容（提及TurboLearn）
- **行 255**: FAQ区域描述
- **行 258-283**: FAQ问题大量提及TurboLearn
- **行 297**: CTA最终标题
- **行 311-315**: Footer网站标题和描述
- **行 319**: Footer版权信息`"copyright": "© 2025 • TurboLearn Все права защищены."`
- **行 389-407**: Footer社交链接（x.com/turbolearn、github.com/turbolearn等）

**处理建议**:
1. **建议删除**:
   - 如果俄语版本不使用，建议删除整个ru.json文件
   - 删除所有社交媒体链接（如果不维护这些账号）
2. **建议替换**:
   - 模板行: `"template": "watermarkcleaner"`
   - 所有TurboLearn → WatermarkCleaner
   - 所有Quizlet → Photoshop/Watermark/Competitors
   - 社交媒体链接更新为实际存在的账号

**韩语版本 (ko.json)**:
- **行 389-407**: 社交链接（support@turbolearn.ai邮箱等）

**法语版本 (fr.json)**:
- **行 389-407**: 社交链接（support@turbolearn.ai邮箱）

---

### 3. 法律文档

#### 3.1 服务条款 (Terms of Service)
 **文件**  : `src/app/(legal)/terms-of-service/page.mdx`
- **行 5**: 欢迎使用 **TurboLearn** 平台
- **行 9**: TurboLearn提供服务描述
- **行 21**: 版权所有者 **turbolearn.ai**
- **行 23-24**: 知识产权条款提及TurboLearn
- **行 65**: 责任限制提及turbolearn.ai
- **行 69**: 赔偿条款提及turbolearn.ai
- **行 73**: 管辖法律条款提及turbolearn.ai
- **行 81**: 联系邮箱 [support@turbolearn.ai]

 **处理建议**  :
1. **建议删除**: 完全删除此文件（如果不提供独立的服务条款）
2. **建议替换**:
   - TurboLearn → WatermarkCleaner
   - turbolearn.ai → watermarkcleaner.com
   - support@turbolearn.ai → support@watermarkcleaner.com

---

#### 3.2 隐私政策 (Privacy Policy)
 **文件**  : `src/app/(legal)/privacy-policy/page.mdx`
- **行 5**: 欢迎使用 **TurboLearn** AI学习平台
- **行 55-56**: 联系信息
  - **Copyright Owner**: [turbolearn.ai](http://turbolearn.ai)
  - **Email**: [support@turbolearn.ai](mailto:support@turbolearn.ai)

 **处理建议**  :
1. **建议删除**: 完全删除此文件（如果不提供独立的隐私政策）
2. **建议替换**:
   - TurboLearn → WatermarkCleaner
   - turbolearn.ai → watermarkcleaner.com
   - support@turbolearn.ai → support@watermarkcleaner.com

---

### 4. 源代码文件

#### 4.1 管理后台布局
 **文件**  : `src/app/[locale]/(admin)/layout.tsx`
- **行 70**: `url: "https://docs.turbolearn.ai"`
- **行 76**: `url: "https://turbolearn.ai/blocks"`
- **行 82**: `url: "https://turbolearn.ai/showcase"`
- **行 98**: `url: "https://github.com/turbolearnai/turbolearn-template-one"`
- **行 110**: `url: "https://x.com/turbolearnai"`

 **处理建议**  :
1. **建议删除**: 删除所有这些文档和社交媒体链接
2. **建议替换**:
   - docs.turbolearn.ai → docs.watermarkcleaner.com（如果存在）
   - turbolearn.ai/blocks → watermarkcleaner.com/features
   - github.com/turbolearnai → github.com/watermarkcleaner
   - x.com/turbolearnai → x.com/watermarkcleaner

---

#### 4.2 订单页面
 **文件**  : `src/app/[locale]/(default)/(console)/my-orders/page.tsx`
- **行 58**: `url: "https://docs.turbolearn.ai"`

 **处理建议**  :
1. **建议删除**: 删除这行文档链接
2. **建议替换**: `url: "https://docs.watermarkcleaner.com"`（如果存在）

---

### 5. 模板/占位内容

#### 5.1 多语言产品名称
**问题总结**:
- 所有定价页面（7个语言版本）都有TurboLearn产品名称
- 所有展示页面（7个语言版本）都有TurboLearn标题
- 着陆页翻译文件（至少5个语言版本）大量提及TurboLearn

**统一处理建议**:
1. **建议删除**: 如果这些语言版本不使用，建议删除整个i18n/pages目录
2. **建议替换**:
   - 英语: WatermarkCleaner
   - 中文: 水印清理器 / WatermarkCleaner
   - 俄语: WatermarkCleaner
   - 韩语: 워터마크클리너 / WatermarkCleaner
   - 其他语言保持"WatermarkCleaner"（品牌名不翻译）

---

## 🔍 按优先级排序的处理清单

### 🚨 最高优先级（1-2天内必须处理）
- [ ] `src/i18n/messages/en.json` - 首页SEO元数据
- [ ] `src/i18n/messages/zh.json` - 中文首页SEO
- [ ] `src/app/(legal)/terms-of-service/page.mdx` - 法律文档
- [ ] `src/app/(legal)/privacy-policy/page.mdx` - 法律文档
- [ ] `.env.example` - 项目配置
- [ ] `package.json` - 构建脚本
- [ ] `wrangler.toml.example` - 部署配置

### ⚠️ 中高优先级（1周内处理）
- [ ] `src/i18n/pages/pricing/*.json` - 所有产品名称（7个文件）
- [ ] `src/i18n/pages/showcase/*.json` - 所有展示页面标题（7个文件）
- [ ] `src/i18n/pages/landing/en.json` - 英文着陆页
- [ ] `src/i18n/pages/landing/zh.json` - 中文着陆页

### 📋 中低优先级（可选处理）
- [ ] `src/i18n/messages/ru.json` - 俄语翻译
- [ ] `src/i18n/messages/ar.json` - 阿拉伯语翻译
- [ ] `src/i18n/messages/ko.json` - 韩语翻译
- [ ] `src/i18n/messages/es.json` - 西班牙语翻译
- [ ] `src/i18n/messages/fr.json` - 法语翻译
- [ ] `src/i18n/pages/landing/[ru/ko/fr/es/ar].json` - 其他语言着陆页
- [ ] `src/app/[locale]/(admin)/layout.tsx` - 管理后台链接
- [ ] `src/app/[locale]/(default)/(console)/my-orders/page.tsx` - 文档链接

---

## 📊 内容类型统计

| 内容类型 | 数量 | 主要位置 | 处理难度 |
|---------|------|---------|---------|
| 品牌名称 | 150+ | 翻译文件 | 中等 |
| 产品名称 | 21 | 定价页面 | 简单 |
| 页面标题 | 15 | 着陆页 | 中等 |
| 描述文本 | 20 | 元数据 | 中等 |
| URL链接 | 12 | 源代码 | 简单 |
| 邮箱地址 | 7 | 法律文档 | 简单 |
| 版权信息 | 7 | Footer | 简单 |
| 社交媒体 | 5 | Footer/Admin | 简单 |
| 模板标识 | 3 | 配置文件 | 简单 |

---

## 🎯 推荐的整体替换策略

### 策略A: 激进清理（推荐）
适用于只使用英文和中文的场景：
1. 删除所有非en/zh的i18n文件
2. 删除showcase模块
3. 简化法律文档或重定向到外部链接
4. 删除管理后台的文档链接

**优点**: 快速完成，维护成本低
**缺点**: 丢失多语言支持

---

### 策略B: 渐进替换
适用于保留多语言功能的场景：
1. 优先处理en和zh
2. 其他语言使用机器翻译批量替换
3. 保持文档链接但更新域名
4. 更新社交媒体链接（如有账号）

**优点**: 保留完整功能，用户体验好
**缺点**: 工作量巨大（约200处替换）

---

### 策略C: 混合方案（推荐）
结合上述两种策略：
1. 立即处理高优先级内容（配置、法律、en/zh）
2. 暂时禁用非核心语言的翻译（注释掉路由）
3. 后续逐步补充完整翻译
4. 删除不使用的showcase模块

**优点**: 平衡效率与功能，最灵活
**缺点**: 需要两次开发迭代

---

## 📄 替换对照表

### 标准替换
| 原内容 | 替换为 | 位置数量 |
|--------|--------|---------|
| TurboLearn | WatermarkCleaner | 150+ |
| turbolearn.ai | watermarkcleaner.com | 7 |
| support@turbolearn.ai | support@watermarkcleaner.com | 7 |
| turbolearn-template-one | watermarkcleaner | 3 |
| Best free Quizlet alternative | AI-Powered Watermark Remover | 7 |
| Remove watermarks from photos free | Remove watermarks from photos free | N/A |

### URL映射
| 原URL | 新URL | 类型 |
|-------|-------|------|
| https://docs.turbolearn.ai | https://docs.watermarkcleaner.com | 文档 |
| https://turbolearn.ai/blocks | https://watermarkcleaner.com/features | 功能 |
| https://turbolearn.ai/showcase | DELETE | 展示 |
| https://github.com/turbolearnai | https://github.com/watermarkcleaner | GitHub |
| https://x.com/turbolearnai | DELETE / 实际账号 | Twitter |
| https://discord.gg/turbolearn | DELETE / 实际邀请 | Discord|

---

## ⚠️ 注意事项

### 1. 配置文件修改后
- 需要重启开发服务器
- Docker构建需要测试
- Cloudflare部署配置需要更新

### 2. i18n文件修改后
- 需要清除浏览器缓存
- 需要重新构建静态资源
- 某些缓存的翻译可能需要手动清除

### 3. 法律文档修改
- 建议咨询法律顾问
- 确保符合当地法律法规
- 保持与网站实际功能一致

### 4. 链接地址
- 确认新域名已注册并可访问
- 确认邮箱地址已设置
- 确认社交媒体账号存在

---

## 📋 验证清单

处理完成后，请验证以下项目：

- [ ] 网站标题显示为WatermarkCleaner
- [ ] 浏览器标签显示正确的网站名称
- [ ] 搜索引擎结果更新（需要等待索引）
- [ ] 所有内部链接不再包含turbolearn
- [ ] 邮件发送功能使用正确域名
- [ ] 社交媒体链接指向正确账号
- [ ] 法律文档信息与网站实际一致

---

## 📝 结论

本次审查发现 **38个文件** 包含turbolearn关键词，约 **200多处引用**。其中 **高优先级内容7项**，**中优先级内容11项**，**低优先级内容约180项**。

**推荐方案**: 采用**策略C（混合方案）**，预计2-3天完成核心替换，后续可以逐步完善多语言内容。

**预计工作量**:
- 高优先级: 2-3小时
- 中优先级: 4-6小时
- 低优先级: 8-12小时
- **总计: 14-21小时**

**风险等级**: 中等（主要是SEO影响和内容一致性）

---

*本报告由Claude Code自动生成，基于2025-12-13的代码库状态*
