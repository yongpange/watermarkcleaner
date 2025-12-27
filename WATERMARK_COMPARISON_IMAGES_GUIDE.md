# 水印对比图片资源管理指南

## 概述
本指南用于管理博客文章"2025年终极指南：如何使用AI技术完美去除图片水印"中的5组对比图片资源。

## 图片存储位置
所有对比图片应存放在以下路径：
```
public/images/watermark-comparison/
```

注意：在Next.js项目中，静态资源应放在`public`目录下，这样可以通过`/images/watermark-comparison/`路径直接访问。

## 文件命名规范

### 命名格式
- **去水印前图片**：`before-{序号}.{格式}`
- **去水印后图片**：`after-{序号}.{格式}`

### 示例
```
before-1.jpg
after-1.jpg
before-2.png
after-2.png
before-3.jpg
after-3.jpg
before-4.jpg
after-4.jpg
before-5.jpg
after-5.jpg
```

## 图片要求

### 技术规格
- **推荐宽度**：1000-1200像素（确保高质量对比效果）
- **文件大小**：建议不超过2MB（优化页面加载速度）
- **格式支持**：JPG、PNG、WEBP
- **颜色模式**：RGB
- **分辨率**：72-150 DPI（适合网页显示）

### 内容要求
1. **去水印前图片**：
   - 必须包含清晰可见的水印
   - 水印类型应与对应章节匹配（文字/Logo/半透明等）
   - 保持原始图片质量

2. **去水印后图片**：
   - 水印应完全去除
   - 保持图片自然效果
   - 无明显处理痕迹

## 组件使用位置

### 第1组：基础效果展示
**位置**：步骤3：查看和下载结果（中/英文版）
**用途**：展示基本的水印去除效果
**SEO描述**：
- 中文：示例图片 - 去水印前/后效果
- 英文：Example - Before/After watermark removal

### 第2组：简单文字水印
**位置**：简单文字水印章节（中/英文版）
**用途**：展示角落文字水印的去除效果
**SEO描述**：
- 中文：简单文字水印去除前/后 - 角落文字水印/完全无痕
- 英文：Simple text watermark removal - corner text watermark/completely clean result

### 第3组：复杂Logo水印
**位置**：复杂Logo水印章节（中/英文版）
**用途**：展示公司Logo水印的去除挑战
**SEO描述**：
- 中文：复杂Logo水印去除前/后 - 公司Logo覆盖/背景完美重建
- 英文：Complex logo watermark removal - company logo overlay/perfect background reconstruction

### 第4组：半透明水印
**位置**：半透明水印章节（中/英文版）
**用途**：展示最难处理的水印类型
**SEO描述**：
- 中文：半透明水印去除前/后 - 微妙的覆盖层/纹理保持一致
- 英文：Semi-transparent watermark removal - subtle overlay/texture consistency maintained

### 第5组：商业应用案例
**位置**：营销材料准备案例研究（中/英文版）
**用途**：展示实际商业应用场景
**SEO描述**：
- 中文：库存照片水印去除前/后 - 预览水印覆盖/清洁专业版本
- 英文：Stock photo watermark removal - preview watermark overlay/clean professional version

## 组件参数设置

### 统一参数
```tsx
<ImageComparison
  beforeImage="/images/watermark-comparison/before-{序号}.jpg"
  afterImage="/images/watermark-comparison/after-{序号}.jpg"
  altBefore="{SEO友好的描述}"
  altAfter="{SEO友好的描述}"
  width={800}
/>
```

### 响应式行为
- **桌面端**：显示为800px宽度的完整对比组件
- **平板端**：自适应宽度，保持比例
- **移动端**：全宽度显示，支持触摸拖动

## 更新流程

### 替换图片步骤
1. 准备新的对比图片对（确保尺寸和比例一致）
2. 按照命名规范重命名文件
3. 替换`public/images/watermark-comparison/`目录中的对应文件
4. 验证组件显示效果

### 添加新对比组
1. 确定新对比组的插入位置
2. 创建对应的before/after图片
3. 在文章中插入组件代码
4. 更新本指南文档

## SEO优化建议

### Alt文本最佳实践
- 描述图片的具体内容
- 包含关键词"watermark removal"
- 保持简洁明了
- 中英文版本分别优化

### 文件名优化
- 使用描述性文件名
- 包含关键词（可选）
- 避免特殊字符和空格

## 性能优化

### 图片压缩
- 使用适当的压缩率平衡质量和大小
- 考虑使用WebP格式获得更好压缩效果
- 为不同设备准备响应式图片版本

### 加载优化
- 组件支持懒加载
- 优先加载可见区域的图片
- 使用CDN加速图片分发

## 常见问题

### Q: 图片显示比例不一致怎么办？
A: 确保before和after图片具有相同的尺寸和比例

### Q: 如何优化移动端体验？
A: 组件已内置响应式设计，确保图片清晰度即可

### Q: 可以添加更多对比组吗？
A: 可以，按照相同的命名规范和组件参数添加即可

## 维护记录
- 创建日期：2025-12-27
- 创建人：Claude Code AI
- 最后更新：2025-12-27

## 相关文件
- 组件文件：`src/components/image-comparison/index.tsx`（现有组件）
- 渲染器：`src/components/markdown/mdx-renderer.tsx`（新增）
- 博客页面：`src/app/[locale]/blog/[slug]/page.tsx`（已修改）
- 中文文章：`content/blog/ultimate-guide-to-ai-image-watermark-removal-2025/zh.mdx`
- 英文文章：`content/blog/ultimate-guide-to-ai-image-watermark-removal-2025/en.mdx`
- 图片存储：`public/images/watermark-comparison/`