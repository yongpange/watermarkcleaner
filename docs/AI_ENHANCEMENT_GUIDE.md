# 🤖 AI 增强功能实现指南

## 功能概述

在 Workspace 页面集成 DeepSeek AI，自动将转换后的 Markdown 内容总结为学习笔记。

### 核心特性

- ✅ **自动触发**：页面加载时自动生成 AI 笔记
- ✅ **流式输出**：实时显示生成内容（打字机效果）
- ✅ **智能总结**：将文档整理成考试复习笔记
- ✅ **一键切换**：AI 笔记 ↔ 原始预览
- ✅ **重新生成**：支持重新生成 AI 内容
- ✅ **错误处理**：API 失败时优雅降级

---

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Workspace 页面                        │
├──────────────┬──────────────────────┬───────────────────┤
│   Toolbar    │                      │                   │
│  [AI 笔记]   │   左侧：编辑器        │  右侧：AI 预览     │
│  [原始预览]  │   (原始 Markdown)    │  (AI 生成笔记)    │
│              │                      │                   │
└──────────────┴──────────────────────┴───────────────────┘
                         │
                         ▼
              POST /api/ai/summarize
                         │
                         ▼
              DeepSeek API (流式)
                         │
                         ▼
              Server-Sent Events (SSE)
                         │
                         ▼
              实时更新 AI 预览区域
```

---

## 实现文件清单

### 1. API 路由
**文件**: `src/app/api/ai/summarize/route.ts`

**功能**:
- 接收原始 Markdown 内容
- 构建提示词（总结为学习笔记）
- 调用 DeepSeek API（流式）
- 返回 Server-Sent Events 流

**关键代码**:
```typescript
// 提示词模板
const prompt = `${content}

帮我把上面内容总结归纳一下，整理成学习笔记的形式，考试要考上面的内容，总结要全面`;

// DeepSeek API 配置
{
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: prompt }],
  stream: true,
  temperature: 0.7,
  max_tokens: 4000,
}
```

---

### 2. AI 预览组件
**文件**: `src/components/workspace/AIPreview.tsx`

**功能**:
- 自动触发 AI 生成
- 流式接收和显示内容
- 打字机效果（光标动画）
- 重新生成按钮
- 加载/错误状态

**状态管理**:
```typescript
const [aiContent, setAiContent] = useState("");        // AI 生成的内容
const [isGenerating, setIsGenerating] = useState(false); // 生成中
const [error, setError] = useState<string | null>(null); // 错误信息
const [hasGenerated, setHasGenerated] = useState(false); // 是否已生成
```

**流式处理**:
```typescript
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // 解析 SSE 数据
  const chunk = decoder.decode(value);
  const lines = chunk.split("\n");
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const json = JSON.parse(line.slice(6));
      accumulatedContent += json.content;
      setAiContent(accumulatedContent); // 实时更新
    }
  }
}
```

---

### 3. Workspace 客户端
**文件**: `src/app/[locale]/workspace/client.tsx`

**修改**:
- 导入 `AIPreview` 组件
- 添加 `useAIPreview` 状态（默认 true）
- 条件渲染 AI 预览或原始预览

**关键代码**:
```typescript
const [useAIPreview, setUseAIPreview] = useState(true);

// 预览区域
{showPreview && (
  <div className="w-1/2 bg-muted/30">
    {useAIPreview ? (
      <AIPreview originalContent={content} />
    ) : (
      <MarkdownPreview content={content} />
    )}
  </div>
)}
```

---

### 4. 工具栏组件
**文件**: `src/components/workspace/Toolbar.tsx`

**修改**:
- 添加 AI 切换按钮
- 新增 props: `useAIPreview`, `onToggleAIPreview`
- 图标: `Sparkles` (AI) / `FileCode` (原始)

**UI 设计**:
```typescript
<Button
  variant={useAIPreview ? "default" : "outline"}
  onClick={onToggleAIPreview}
>
  {useAIPreview ? (
    <><Sparkles /> AI 笔记</>
  ) : (
    <><FileCode /> 原始预览</>
  )}
</Button>
```

---

### 5. 环境变量
**文件**: `.env.example`

**新增**:
```bash
# DeepSeek API
DEEPSEEK_API_KEY = ""
```

**配置步骤**:
1. 访问 https://platform.deepseek.com
2. 注册账号并获取 API Key
3. 复制 `.env.example` 为 `.env.local`
4. 填入 `DEEPSEEK_API_KEY`

---

## 使用流程

### 用户操作流程

1. **上传文件**
   - 在 `/convert` 页面上传 Word/PDF/TXT 文件
   - 等待转换完成

2. **进入 Workspace**
   - 点击 "Advanced Edit" 按钮
   - 跳转到 `/workspace?fileId=xxx`

3. **自动生成 AI 笔记**
   - 页面加载时自动触发
   - 右侧显示 "AI 正在生成学习笔记..."
   - 实时显示生成内容（打字机效果）

4. **查看和编辑**
   - 左侧：原始 Markdown（可编辑）
   - 右侧：AI 生成的学习笔记（只读）

5. **切换预览模式**
   - 点击工具栏 "AI 笔记" 按钮 → 切换到 "原始预览"
   - 点击 "原始预览" 按钮 → 切换回 "AI 笔记"

6. **重新生成**
   - 点击右侧 "重新生成" 按钮
   - AI 重新总结内容

---

## 技术细节

### DeepSeek API 集成

**API 端点**: `https://api.deepseek.com/v1/chat/completions`

**请求格式**:
```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "user",
      "content": "原始内容 + 提示词"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 4000
}
```

**响应格式** (SSE):
```
data: {"choices":[{"delta":{"content":"学"}}]}
data: {"choices":[{"delta":{"content":"习"}}]}
data: {"choices":[{"delta":{"content":"笔"}}]}
data: [DONE]
```

---

### 流式响应处理

**服务端** (`route.ts`):
```typescript
const stream = new ReadableStream({
  async start(controller) {
    const reader = response.body?.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // 转发到客户端
      controller.enqueue(encoder.encode(`data: ${json}\n\n`));
    }
  }
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
});
```

**客户端** (`AIPreview.tsx`):
```typescript
const reader = response.body?.getReader();
let accumulatedContent = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // 解析 SSE 数据
  accumulatedContent += parsedContent;
  setAiContent(accumulatedContent); // 实时更新 UI
}
```

---

## 错误处理

### 1. API Key 未配置
```typescript
if (!apiKey) {
  return Response.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
}
```

**用户提示**: "AI 功能未配置，请联系管理员"

### 2. API 请求失败
```typescript
if (!response.ok) {
  throw new Error('DeepSeek API request failed');
}
```

**用户提示**: "AI 生成失败，请重试"

### 3. 网络错误
```typescript
catch (error) {
  setError(error.message);
  toast.error("Failed to generate summary");
}
```

**降级方案**: 显示错误信息 + 重试按钮

---

## 性能优化

### 1. 自动生成控制
```typescript
useEffect(() => {
  if (originalContent && !hasGenerated) {
    generateSummary(); // 只生成一次
  }
}, [originalContent]);
```

### 2. 流式渲染
- 使用 `ReadableStream` 避免阻塞
- 实时更新 UI，提升用户体验

### 3. 错误重试
- 提供 "重新生成" 按钮
- 不自动重试，避免浪费 API 配额

---

## 测试步骤

### 1. 配置环境
```bash
# 复制环境变量
cp .env.example .env.local

# 填入 DeepSeek API Key
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxx"
```

### 2. 启动服务
```bash
pnpm dev
```

### 3. 测试流程
1. 访问 http://localhost:3001/en/convert
2. 上传一个 Word 文件（包含一些学习内容）
3. 点击 "Advanced Edit"
4. 观察右侧 AI 笔记生成过程
5. 测试切换按钮（AI 笔记 ↔ 原始预览）
6. 测试重新生成按钮

### 4. 验证功能
- ✅ AI 自动生成
- ✅ 流式显示（打字机效果）
- ✅ 内容格式正确（Markdown 渲染）
- ✅ 切换按钮工作
- ✅ 重新生成工作
- ✅ 错误处理正常

---

## 常见问题

### Q1: AI 生成失败怎么办？
**A**: 检查以下几点：
1. `.env.local` 中是否配置了 `DEEPSEEK_API_KEY`
2. API Key 是否有效
3. 网络是否正常
4. 查看浏览器控制台错误信息

### Q2: 生成速度慢怎么办？
**A**: 
- DeepSeek API 响应时间取决于内容长度
- 通常 1000 字内容需要 5-10 秒
- 流式输出可以让用户看到进度

### Q3: 如何自定义提示词？
**A**: 修改 `src/app/api/ai/summarize/route.ts` 中的 `prompt` 变量：
```typescript
const prompt = `${content}

你的自定义提示词`;
```

### Q4: 如何更换其他 AI 模型？
**A**: 修改 API 路由中的配置：
```typescript
// 例如使用 GPT-4
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4',
    // ...
  }),
});
```

---

## 总结

### 实现的功能
- ✅ DeepSeek API 集成
- ✅ 流式响应处理
- ✅ AI 预览组件
- ✅ 自动生成触发
- ✅ 切换预览模式
- ✅ 重新生成功能
- ✅ 错误处理

### 技术栈
- **AI 服务**: DeepSeek API
- **流式传输**: Server-Sent Events (SSE)
- **前端框架**: Next.js 15 + React
- **UI 组件**: Shadcn UI
- **状态管理**: React Hooks

### 下一步优化
- [ ] 添加 AI 生成历史记录
- [ ] 支持自定义提示词
- [ ] 添加导出 AI 笔记功能
- [ ] 支持多种 AI 模型切换
- [ ] 添加 AI 生成进度百分比

---

**实现时间**: 2025-10-29  
**状态**: ✅ 完成并可用  
**文档版本**: 1.0

