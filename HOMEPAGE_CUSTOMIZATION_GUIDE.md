# 网站首页定制指南

## 🎯 概述

这个网站采用模块化设计，非常适合作为模板来创建不同功能的网站。您只需要修改首页样式，其他功能（博客、转换工具、工作区等）可以保持不变。

## 📁 文件结构

### 首页主要文件
```
src/app/[locale]/(default)/page.tsx          # 首页主组件
src/components/blocks/hero/index.tsx         # 首页头部区域
src/i18n/pages/landing/en.json              # 首页内容配置
src/components/blocks/                      # 其他模块组件
```

### 可复用的功能模块
```
src/app/[locale]/blog/                      # 博客系统
src/app/[locale]/convert/                   # 文件转换工具
src/app/[locale]/workspace/                 # 文档工作区
src/app/[locale]/auth/                      # 用户认证
src/app/api/                                # API接口
```

## 🎨 定制步骤

### 第一步：修改品牌信息
编辑 `src/i18n/pages/landing/en.json`：

```json
{
  "template": "your-brand-template",
  "theme": "light",
  "header": {
    "brand": {
      "title": "您的品牌名称",
      "logo": {
        "src": "/your-logo.png",
        "alt": "您的品牌描述"
      }
    }
  },
  "hero": {
    "title": "您的主标题",
    "highlight_text": "高亮关键词",
    "description": "您的网站描述"
  }
}
```

### 第二步：修改Hero区域
编辑 `src/components/blocks/hero/index.tsx`：

- 修改标题样式
- 更改按钮样式和链接
- 调整背景效果
- 自定义CTA按钮

### 第三步：调整页面模块
在 `src/app/[locale]/(default)/page.tsx` 中：

```tsx
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <>
      {/* 选择需要的模块 */}
      {page.hero && <Hero hero={page.hero} />}
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.benefit && <Feature2 section={page.benefit} />}
      {/* 可以注释掉不需要的模块 */}
      {/* {page.showcase && <Showcase section={page.showcase} />} */}
      {/* {page.pricing && <Pricing pricing={page.pricing} />} */}
    </>
  );
}
```

### 第四步：自定义样式
编辑全局样式文件：
- `src/app/globals.css` - 全局样式
- `src/app/theme.css` - 主题变量
- `tailwind.config.ts` - Tailwind配置

## 🚀 快速启动新项目

### 1. 复制项目结构
```bash
cp -r turbolearn_buzz my_new_project
cd my_new_project
```

### 2. 修改package.json
```json
{
  "name": "my-new-project",
  "description": "我的新项目描述"
}
```

### 3. 更新环境变量
编辑 `.env.local`：
```
NEXT_PUBLIC_WEB_URL=https://www.mynewproject.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. 修改首页内容
- 替换 `src/i18n/pages/landing/en.json` 中的内容
- 更新 `public/logo.png` 为您的品牌logo
- 修改 `src/components/blocks/hero/index.tsx` 中的样式

### 5. 保留的功能模块
✅ **可以保留的功能**：
- 用户认证系统
- 文件转换工具
- 文档工作区
- 博客系统
- 多语言支持
- 管理后台

## 🎨 设计建议

### 现代化首页元素
1. **Hero区域**
   - 清晰的标题和副标题
   - 突出的CTA按钮
   - 吸引人的背景（渐变、图片或视频）

2. **特色介绍**
   - 3-4个核心功能点
   - 图标和简短描述
   - 响应式布局

3. **社会证明**
   - 客户评价
   - 使用统计数据
   - 合作伙伴logo

4. **CTA区域**
   - 免费试用按钮
   - 注册表单
   - 联系信息

### 不同行业的定制方向

#### SaaS产品
- 功能演示视频
- 价格对比表
- 客户案例研究

#### 电商平台
- 产品展示轮播
- 特色商品推荐
- 促销活动信息

#### 教育平台
- 课程展示
- 教师介绍
- 学习成果展示

#### 企业官网
- 公司介绍
- 服务项目
- 团队展示

## 🔧 技术特性

### 响应式设计
- 移动端优先
- 自适应布局
- 触摸友好

### SEO优化
- 服务端渲染
- 元数据管理
- 结构化数据

### 性能优化
- 图片优化
- 代码分割
- 缓存策略

## 📱 预览和测试

开发服务器正在运行中，您可以：
- 访问 `http://localhost:3000` 查看当前网站
- 实时预览修改效果
- 测试不同设备的响应式表现

## 🎯 下一步建议

1. **确定您的业务方向**（教育、SaaS、电商等）
2. **准备品牌素材**（logo、颜色、文案）
3. **规划首页结构**（需要哪些模块）
4. **开始定制开发**

如果您有具体的业务方向或设计需求，我可以帮您制定更详细的定制方案！您希望创建什么类型的网站呢？