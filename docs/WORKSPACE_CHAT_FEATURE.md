# 📝 Workspace 页面聊天功能实现文档

## 🎯 功能概述

在 `/workspace` 页面实现了 document 按钮功能，用户可以在以下两种模式之间切换：
1. **Document 模式**（默认）：左侧显示 AI 学习笔记，右侧显示聊天界面
2. **Chatbot 模式**：全屏显示聊天界面

## ✅ 已完成的功能

### 1. 聊天 API 路由
**文件**: `src/app/api/ai/chat/route.ts`

**功能**:
- 支持多轮对话
- 集成 DeepSeek API
- 流式响应（Server-Sent Events）
- 自动包含文档内容作为上下文

**关键特性**:
```typescript
// 系统提示词包含文档内容
const systemMessage = {
  role: 'system',
  content: `你是一个智能学习助手。用户正在学习以下文档内容：
${documentContent}
请基于这份文档内容回答用户的问题...`
};

// 流式响应
{
  model: 'deepseek-chat',
  messages: [systemMessage, ...messages],
  stream: true,
  temperature: 0.7,
  max_tokens: 2000,
}
```

### 2. 聊天界面组件
**文件**: `src/components/workspace/ChatInterface.tsx`

**功能**:
- 消息列表显示（用户消息 + AI 回复）
- 实时流式显示 AI 回复（打字机效果）
- 输入框支持多行输入
- 快捷键：Enter 发送，Shift+Enter 换行
- 自动滚动到最新消息
- 加载状态显示

**UI 特性**:
- 用户消息：蓝色背景，右对齐
- AI 消息：灰色背景，左对齐
- 头像图标：用户（User）、AI（Bot）
- 空状态提示
- 打字中动画效果

### 3. Sidebar 组件更新
**文件**: `src/components/workspace/Sidebar.tsx`

**新增功能**:
- `onModeChange` 回调：通知父组件模式切换
- `activeMode` 属性：高亮当前激活的模式
- 支持 4 种模式：Document、Chatbot、Flashcards、Quiz
- 点击 Document/Chatbot 切换模式，其他显示"开发中"提示

**Props 接口**:
```typescript
interface SidebarProps {
  metadata?: {...};
  className?: string;
  onModeChange?: (mode: 'document' | 'chatbot' | 'flashcards' | 'quiz') => void;
  activeMode?: 'document' | 'chatbot' | 'flashcards' | 'quiz';
}
```

### 4. Workspace 页面布局调整
**文件**: `src/app/[locale]/workspace/client.tsx`

**新增状态**:
```typescript
const [workspaceMode, setWorkspaceMode] = useState<'document' | 'chatbot' | 'flashcards' | 'quiz'>('document');
```

**布局结构**:

#### Document 模式（默认）
```
┌─────────────────────────────────────────────────┐
│                   Toolbar                       │
├──────┬──────────────────┬──────────────────────┤
│      │                  │                      │
│      │   AI 学习笔记     │     聊天界面          │
│ Side │   (左侧 50%)     │    (右侧 50%)        │
│ bar  │                  │                      │
│      │  - 自动生成       │  - 多轮对话          │
│      │  - 流式显示       │  - 文档上下文        │
│      │  - 重新生成       │  - 实时响应          │
│      │                  │                      │
└──────┴──────────────────┴──────────────────────┘
```

#### Chatbot 模式
```
┌─────────────────────────────────────────────────┐
│                   Toolbar                       │
├──────┬──────────────────────────────────────────┤
│      │                                          │
│      │          聊天界面（全屏）                 │
│ Side │                                          │
│ bar  │        - 更大的对话空间                   │
│      │        - 专注于聊天交互                   │
│      │                                          │
└──────┴──────────────────────────────────────────┘
```

## 🔧 技术实现细节

### 流式响应处理

**API 端**:
```typescript
// 创建 ReadableStream
const stream = new ReadableStream({
  async start(controller) {
    // 读取 DeepSeek API 响应
    const { done, value } = await reader.read();
    
    // 解析并转发数据
    const sseData = `data: ${JSON.stringify({ content })}\n\n`;
    controller.enqueue(encoder.encode(sseData));
  }
});

// 返回 SSE 响应
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

**客户端**:
```typescript
// 读取流式响应
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // 解析 SSE 数据
  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = JSON.parse(line.slice(6));
      // 实时更新消息
      setMessages(prev => [...]);
    }
  }
}
```

### 文档上下文集成

聊天 API 会自动将文档内容作为系统提示词的一部分：

```typescript
// 前端发送
fetch('/api/ai/chat', {
  body: JSON.stringify({
    messages: [...],
    documentContent: content, // 当前文档内容
  }),
});

// 后端处理
const systemMessage = {
  role: 'system',
  content: `你是一个智能学习助手。用户正在学习以下文档内容：
${documentContent}
请基于这份文档内容回答用户的问题...`
};
```

这样 AI 就能理解文档内容并提供相关的回答。

## 📋 使用流程

### 用户操作流程

1. **进入 Workspace**
   - 从 `/convert` 页面点击 "Advanced Edit"
   - 或直接访问 `/workspace?fileId=xxx`

2. **默认显示 Document 模式**
   - 左侧：AI 自动生成学习笔记
   - 右侧：聊天界面（可以提问）

3. **与 AI 对话**
   - 在右侧聊天框输入问题
   - AI 基于文档内容回答
   - 支持多轮对话

4. **切换到 Chatbot 模式**
   - 点击左侧 Sidebar 的 "Chatbot" 按钮
   - 聊天界面全屏显示
   - 更专注的对话体验

5. **切换回 Document 模式**
   - 点击左侧 Sidebar 的 "Document" 按钮
   - 恢复左右分屏布局

## 🎨 UI/UX 设计

### 聊天界面设计

**颜色方案**:
- 用户消息：`bg-primary text-primary-foreground`（主题色）
- AI 消息：`bg-muted`（灰色背景）
- 头部：渐变背景 `from-blue-500/5 to-purple-500/5`

**图标**:
- AI 助手：`Bot` 图标（紫色）
- 用户：`User` 图标（蓝色）
- 发送：`Send` 图标
- 加载：`Loader2` 旋转动画

**动画效果**:
- 打字中：3 个圆点依次闪烁
- 发送中：按钮显示旋转加载图标
- 消息出现：自动滚动到底部

### Sidebar 按钮状态

**激活状态**:
- 折叠模式：`variant="secondary"`（灰色背景）
- 展开模式：`variant="default"`（主题色背景）

**未激活状态**:
- 折叠模式：`variant="ghost"`（透明背景）
- 展开模式：`variant="outline"`（边框样式）

## 🔍 测试建议

### 功能测试

1. **聊天功能**
   - ✅ 发送消息
   - ✅ 接收 AI 回复
   - ✅ 流式显示效果
   - ✅ 多轮对话
   - ✅ 文档上下文理解

2. **模式切换**
   - ✅ Document ↔ Chatbot 切换
   - ✅ 按钮高亮状态
   - ✅ 布局正确显示

3. **边界情况**
   - ✅ 空消息不能发送
   - ✅ 加载中不能重复发送
   - ✅ API 错误处理
   - ✅ 网络断开处理

### 性能测试

1. **流式响应**
   - 测试长文本生成
   - 测试网络延迟情况
   - 测试并发请求

2. **内存管理**
   - 测试长对话历史
   - 测试大文档内容
   - 测试组件卸载

## 🐛 已知问题和限制

### 当前限制

1. **对话历史**
   - 不持久化（刷新页面会丢失）
   - 建议：后续可以保存到 localStorage 或数据库

2. **文档更新**
   - 编辑文档后，聊天上下文不会自动更新
   - 建议：监听 content 变化，提示用户重新开始对话

3. **消息长度**
   - 单条消息最大 2000 tokens
   - 建议：添加字数统计和限制提示

4. **并发限制**
   - 同时只能有一个请求
   - 建议：添加请求队列管理

## 🚀 未来优化方向

### 短期优化

1. **对话历史持久化**
   - 保存到 localStorage
   - 支持清空历史
   - 支持导出对话

2. **更好的错误处理**
   - 网络错误重试
   - API 限流提示
   - 超时处理

3. **用户体验优化**
   - 消息编辑/删除
   - 复制消息内容
   - 代码高亮显示

### 长期规划

1. **高级功能**
   - 语音输入
   - 图片上传
   - 文件附件

2. **智能助手**
   - 自动总结对话
   - 生成学习计划
   - 推荐相关资源

3. **协作功能**
   - 分享对话
   - 多人协作
   - 评论和标注

## 📚 相关文件

### 新增文件
- `src/app/api/ai/chat/route.ts` - 聊天 API 路由
- `src/components/workspace/ChatInterface.tsx` - 聊天界面组件
- `WORKSPACE_CHAT_FEATURE.md` - 本文档

### 修改文件
- `src/app/[locale]/workspace/client.tsx` - 页面布局调整
- `src/components/workspace/Sidebar.tsx` - 添加模式切换

### 依赖文件
- `src/app/api/ai/summarize/route.ts` - AI 总结 API（参考）
- `src/components/workspace/AIPreview.tsx` - AI 学习笔记组件
- `.env.local` - DeepSeek API Key 配置

## 🔑 环境变量

确保 `.env.local` 中配置了：

```bash
# DeepSeek API Key
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxx"
```

## 📞 支持

如有问题，请检查：
1. DeepSeek API Key 是否配置正确
2. 网络连接是否正常
3. 浏览器控制台是否有错误信息
4. API 配额是否充足

---

**实现日期**: 2025-11-02  
**版本**: 1.0.0  
**状态**: ✅ 已完成

