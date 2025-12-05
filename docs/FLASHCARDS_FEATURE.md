# 📚 Workspace 页面 Flashcards（闪卡）功能实现文档

## 🎯 功能概述

在 `/workspace` 页面实现了 Flashcards（闪卡）功能，用户可以通过 AI 自动生成学习卡片，帮助记忆和理解文档内容。

## ✅ 已完成的功能

### 1. Flashcards API 路由
**文件**: `src/app/api/workspace/flashcards/generate/route.ts`

**功能**:
- 调用 DeepSeek API 根据文档内容生成 12 个问答卡片
- 每个卡片包含：问题（question）、答案（answer）、解释（explanation）
- 支持 JSON 格式响应
- 完整的错误处理和验证

**API 接口**:
```typescript
POST /api/workspace/flashcards/generate

Request Body:
{
  "documentContent": "文档内容..."
}

Response:
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": 1,
        "question": "问题内容",
        "answer": "答案内容",
        "explanation": "解释内容"
      },
      // ... 共 12 个卡片
    ],
    "count": 12,
    "generatedAt": "2025-11-03T..."
  }
}
```

### 2. Flashcard 组件
**文件**: `src/components/workspace/Flashcard.tsx`

**功能**:
- 3D 翻转动画效果（使用 CSS transform 和 perspective）
- 正面显示问题（蓝色主题）
- 背面显示答案和解释（绿色主题）
- 点击卡片触发翻转
- 响应式设计，支持深色模式

**技术实现**:
- 使用 `perspective: 1000px` 创建 3D 空间
- 使用 `transform: rotateY(180deg)` 实现翻转
- 使用 `backfaceVisibility: hidden` 隐藏背面
- 平滑过渡动画（duration-500）

### 3. FlashcardsView 组件
**文件**: `src/components/workspace/FlashcardsView.tsx`

**功能**:
- **生成闪卡**: 调用 API 生成 12 个学习卡片
- **卡片导航**: 
  - 进度指示器（1/12 格式）
  - "上一张"和"下一张"按钮
  - 键盘快捷键（← → 方向键）
- **功能按钮区域**:
  - ☆ 已收藏（UI 占位，功能待开发）
  - 点击翻转（提示用户点击卡片）
  - 通过间隔重复跟踪统计数据（UI 占位，功能待开发）
- **重新生成**: 支持重新生成闪卡
- **加载状态**: 显示生成进度

**交互特性**:
- 未生成状态：显示生成按钮和说明
- 已生成状态：显示卡片和导航控件
- 键盘导航：← 上一张，→ 下一张
- 循环导航：最后一张 → 第一张，第一张 ← 最后一张

### 4. Workspace 页面集成
**文件**: `src/app/[locale]/workspace/client.tsx`

**布局结构**:
```
┌─────────────────────────────────────────────┐
│  Toolbar                                    │
├──────┬──────────────────────────────────────┤
│      │  Flashcards Mode                     │
│      ├──────────────────┬───────────────────┤
│ Side │                  │                   │
│ bar  │  FlashcardsView  │  ChatInterface    │
│      │  (左侧 50%)       │  (右侧 50%)        │
│      │                  │                   │
└──────┴──────────────────┴───────────────────┘
```

**模式切换**:
- Document 模式：AI 学习笔记 + 聊天
- Chatbot 模式：全屏聊天
- **Flashcards 模式**：闪卡 + 聊天（新增）
- Quiz 模式：待开发

### 5. Sidebar 组件更新
**文件**: `src/components/workspace/Sidebar.tsx`

**更新内容**:
- 将 Flashcards 模式添加到可用模式列表
- 点击 Flashcards 按钮切换到闪卡模式
- 移除"开发中"提示

## 🎨 UI 设计

### 卡片样式
- **正面（问题）**:
  - 蓝色渐变背景（from-blue-50 to-indigo-50）
  - 蓝色边框（border-blue-200）
  - 标题："定义"
  - 大号粗体问题文本
  - 底部提示："点击卡片查看答案"

- **背面（答案）**:
  - 绿色渐变背景（from-green-50 to-emerald-50）
  - 绿色边框（border-green-200）
  - 答案区域：标题 + 粗体答案
  - 解释区域：标题 + 详细解释
  - 底部提示："点击卡片返回问题"

### 进度指示器
- 圆角胶囊形状
- 主题色背景（bg-primary/10）
- 大号粗体文字（1/12）

### 导航按钮
- Outline 样式
- 带图标（ChevronLeft / ChevronRight）
- 最小宽度 120px

### 功能按钮
- Ghost 样式
- 小尺寸（size="sm"）
- 带图标和文字
- 待开发功能显示 disabled 状态

## 🚀 使用流程

1. **上传文档**
   - 用户在首页上传文档（PDF、TXT、DOCX 等）
   - 系统转换为 Markdown 格式

2. **进入 Workspace**
   - 点击文档进入 Workspace 页面
   - 默认显示 Document 模式

3. **切换到 Flashcards 模式**
   - 点击 Sidebar 中的 "Flashcards" 按钮
   - 页面切换为左右布局（闪卡 + 聊天）

4. **生成闪卡**
   - 点击"生成闪卡"按钮
   - AI 分析文档内容，生成 12 个问答卡片
   - 显示第一张卡片

5. **学习卡片**
   - 点击卡片查看答案和解释
   - 使用导航按钮或键盘切换卡片
   - 查看进度指示器了解学习进度

6. **配合聊天**
   - 右侧聊天界面可以询问相关问题
   - AI 基于文档内容回答
   - 帮助深入理解卡片内容

## 🔧 技术栈

- **前端框架**: Next.js 15 + React 19
- **样式**: Tailwind CSS v4 + Shadcn UI
- **AI 服务**: DeepSeek API
- **状态管理**: React Hooks (useState, useEffect)
- **动画**: CSS Transform + Transition
- **通知**: Sonner Toast

## 📝 环境变量

确保在 `.env.local` 中配置：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## 🎯 后续优化方向

### 功能增强
1. **收藏功能**
   - 实现卡片收藏/取消收藏
   - 显示收藏的卡片列表
   - 支持导出收藏的卡片

2. **间隔重复算法**
   - 实现 Spaced Repetition System (SRS)
   - 跟踪每张卡片的学习进度
   - 根据记忆曲线调整复习时间
   - 显示学习统计数据

3. **卡片管理**
   - 编辑卡片内容
   - 删除不需要的卡片
   - 添加自定义卡片
   - 导出/导入卡片集

4. **学习模式**
   - 随机模式：打乱卡片顺序
   - 测试模式：隐藏答案，自我评估
   - 复习模式：只显示标记为"需要复习"的卡片

### 性能优化
1. **缓存机制**
   - 缓存生成的闪卡到数据库
   - 避免重复生成相同内容的卡片
   - 支持离线查看已生成的卡片

2. **加载优化**
   - 预加载下一张卡片
   - 懒加载卡片内容
   - 优化 API 响应时间

### UI/UX 改进
1. **动画增强**
   - 添加卡片切换动画
   - 优化翻转动画效果
   - 添加进度条动画

2. **响应式设计**
   - 优化移动端布局
   - 支持触摸手势（滑动切换）
   - 适配不同屏幕尺寸

3. **主题定制**
   - 支持自定义卡片颜色
   - 支持不同的卡片样式
   - 支持字体大小调整

## 🐛 已知问题

无

## 📚 相关文档

- [WORKSPACE_CHAT_FEATURE.md](./WORKSPACE_CHAT_FEATURE.md) - 聊天功能文档
- [WORKSPACE_SAVE_ANALYSIS.md](./WORKSPACE_SAVE_ANALYSIS.md) - 保存功能文档
- [DeepSeek API 文档](https://platform.deepseek.com/docs)

## 🎉 总结

Flashcards 功能已完整实现，包括：
- ✅ AI 自动生成 12 个问答卡片
- ✅ 3D 翻转动画效果
- ✅ 卡片导航和进度指示
- ✅ 键盘快捷键支持
- ✅ 与聊天功能并排显示
- ✅ 响应式设计和深色模式支持

用户可以通过这个功能更好地学习和记忆文档内容，配合聊天功能深入理解知识点。

