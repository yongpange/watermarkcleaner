# 📊 AI 数据存储分析与优化方案

## 📋 任务 1：当前数据存储情况分析

### 1.1 AI 学习笔记（AIPreview 组件）

#### 当前存储方式
- **存储位置**：❌ **仅存储在组件内部状态**
- **存储方式**：React `useState` - `aiContent` 状态
- **持久化**：❌ **无持久化**
- **生命周期**：组件挂载时生成，组件卸载时销毁

#### 代码分析
```typescript
// src/components/workspace/AIPreview.tsx
const [aiContent, setAiContent] = useState("");  // ❌ 仅组件内部状态
const [hasGenerated, setHasGenerated] = useState(false);

useEffect(() => {
  // 每次组件挂载且满足条件时都会重新生成
  if (originalContent && !hasGenerated && !isGenerating && !aiContent) {
    generateSummary();  // ❌ 调用 API 生成
  }
}, [originalContent, hasGenerated, isGenerating, aiContent, generateSummary]);
```

#### 问题分析
1. **重复生成问题**：
   - 切换预览模式（AI 笔记 ↔ 原始预览）时，组件会卸载和重新挂载
   - 从 Chatbot 模式切换回 Document 模式时，组件重新挂载
   - 每次重新挂载，`hasGenerated` 和 `aiContent` 都会重置为初始值
   - 导致 `useEffect` 条件满足，重新调用 API

2. **数据丢失问题**：
   - 刷新页面后，AI 学习笔记丢失
   - 切换模式后，之前生成的内容丢失
   - 无法跨设备访问

3. **性能问题**：
   - 重复调用 DeepSeek API，浪费 token
   - 用户体验差，每次切换都要等待重新生成

### 1.2 AI 助手聊天记录（ChatInterface 组件）

#### 当前存储方式
- **存储位置**：❌ **仅存储在组件内部状态**
- **存储方式**：React `useState` - `messages` 数组
- **持久化**：❌ **无持久化**
- **生命周期**：组件挂载时为空数组，组件卸载时销毁

#### 代码分析
```typescript
// src/components/workspace/ChatInterface.tsx
const [messages, setMessages] = useState<Message[]>([]);  // ❌ 仅组件内部状态

interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

#### 问题分析
1. **数据丢失问题**：
   - 刷新页面后，聊天历史丢失
   - 切换模式后，对话历史丢失
   - 无法查看历史对话

2. **无法跨设备访问**：
   - 数据仅存在浏览器内存中
   - 无法在其他设备继续对话

3. **无法分析和优化**：
   - 无法统计用户常问问题
   - 无法优化 AI 回答质量

### 1.3 数据库现状

#### 已有数据库表
根据 `src/db/schema.ts` 和 Supabase 配置，已有以下表：

1. **users** - 用户表
2. **orders** - 订单表
3. **credits** - 积分表
4. **apikeys** - API 密钥表
5. **posts** - 文章表
6. **affiliates** - 联盟表
7. **feedbacks** - 反馈表
8. **conversions** - 文档转换表 ✅（可扩展用于存储 AI 数据）
9. **user_preferences** - 用户偏好表

#### conversions 表结构
```sql
CREATE TABLE "conversions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "uuid" varchar(255) NOT NULL UNIQUE,
  "user_uuid" varchar(255),  -- 支持匿名用户
  "file_id" varchar(255) NOT NULL,
  "file_name" varchar(500) NOT NULL,
  "file_size" bigint NOT NULL,
  "file_type" varchar(100) NOT NULL,
  "file_url" text,
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "result" jsonb,  -- ✅ 可存储 AI 学习笔记
  "error" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone,
  "expires_at" timestamp with time zone
);
```

**关键特性**：
- ✅ `result` 字段为 `jsonb` 类型，可存储复杂 JSON 数据
- ✅ 支持用户关联（`user_uuid`）
- ✅ 支持匿名用户（`user_uuid` 可为空）
- ✅ 有索引优化（用户、状态、创建时间）

---

## 💡 任务 1 结论：是否适合存储到数据库

### ✅ **强烈建议存储到数据库**

#### AI 学习笔记
**适合存储**：⭐⭐⭐⭐⭐（5 星推荐）

**理由**：
1. ✅ **避免重复生成**：一次生成，永久保存
2. ✅ **节省成本**：减少 DeepSeek API 调用
3. ✅ **提升性能**：无需等待重新生成
4. ✅ **用户体验**：切换模式时立即显示
5. ✅ **数据持久化**：刷新页面不丢失

**存储位置**：`conversions.result` 字段（jsonb）

**数据结构建议**：
```typescript
{
  content: string,           // 原始 Markdown 内容
  format: 'markdown',
  metadata: {
    wordCount: number,
    characterCount: number,
    lastModified: string,
  },
  aiSummary: string,         // ✅ 新增：AI 学习笔记
  aiSummaryGeneratedAt: string,  // ✅ 新增：生成时间
}
```

#### AI 助手聊天记录
**适合存储**：⭐⭐⭐⭐（4 星推荐）

**理由**：
1. ✅ **历史记录**：用户可查看过往对话
2. ✅ **上下文连续**：跨会话保持对话上下文
3. ✅ **数据分析**：了解用户需求，优化产品
4. ✅ **用户体验**：刷新页面不丢失对话
5. ⚠️ **存储成本**：聊天记录可能较多，需考虑清理策略

**存储方案**：创建新表 `chat_sessions`

**表结构建议**：
```sql
CREATE TABLE "chat_sessions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "uuid" varchar(255) NOT NULL UNIQUE,
  "user_uuid" varchar(255),  -- 用户 ID（可为空）
  "file_id" varchar(255) NOT NULL,  -- 关联文档
  "messages" jsonb NOT NULL,  -- 聊天消息数组
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone,
  "expires_at" timestamp with time zone  -- 匿名用户 24 小时过期
);
```

**messages 数据结构**：
```typescript
[
  {
    role: 'user' | 'assistant',
    content: string,
    timestamp: string,
  }
]
```

---

## 🔧 任务 2：修复 AI 学习笔记重复生成问题

### 2.1 问题根源分析

#### 问题 1：组件重新挂载导致状态重置

**触发场景**：
1. 点击"原始预览"按钮 → `useAIPreview` 变为 `false` → `AIPreview` 组件卸载
2. 点击"AI 笔记"按钮 → `useAIPreview` 变为 `true` → `AIPreview` 组件重新挂载
3. 从 Chatbot 模式切换回 Document 模式 → `AIPreview` 组件重新挂载

**代码位置**：`src/app/[locale]/workspace/client.tsx`
```typescript
{workspaceMode === 'document' && (
  <div className="w-1/2 border-r">
    {useAIPreview ? (
      <AIPreview originalContent={content} />  // ❌ 条件渲染导致卸载/挂载
    ) : (
      <MarkdownPreview content={content} />
    )}
  </div>
)}
```

**问题**：
- 组件卸载时，所有内部状态（`aiContent`, `hasGenerated`）都会丢失
- 重新挂载时，状态重置为初始值
- `useEffect` 检测到 `!hasGenerated && !aiContent`，触发重新生成

#### 问题 2：useEffect 依赖项包含 generateSummary

**代码位置**：`src/components/workspace/AIPreview.tsx`
```typescript
useEffect(() => {
  if (originalContent && !hasGenerated && !isGenerating && !aiContent) {
    generateSummary();
  }
}, [originalContent, hasGenerated, isGenerating, aiContent, generateSummary]);
//                                                          ^^^^^^^^^^^^^^
//                                                          ❌ 问题：generateSummary 是 useCallback
```

**问题**：
- `generateSummary` 是 `useCallback`，依赖 `originalContent`
- 每次 `originalContent` 变化，`generateSummary` 重新创建
- 导致 `useEffect` 重新执行（虽然有条件判断，但增加了复杂度）

### 2.2 解决方案

#### 方案 1：状态提升 + 数据库持久化（推荐）⭐⭐⭐⭐⭐

**核心思路**：
1. 将 `aiContent` 状态提升到父组件 `WorkspaceClient`
2. 首次生成后保存到数据库
3. 后续从数据库读取，不再重新生成

**优点**：
- ✅ 彻底解决重复生成问题
- ✅ 数据持久化，刷新不丢失
- ✅ 节省 API 调用成本
- ✅ 提升用户体验

**实现步骤**：

**步骤 1**：扩展 `conversions.result` 字段
```typescript
// 在 conversions 表的 result 字段中添加：
{
  content: string,
  format: 'markdown',
  metadata: {...},
  aiSummary: string,  // ✅ AI 学习笔记
  aiSummaryGeneratedAt: string,  // ✅ 生成时间
}
```

**步骤 2**：修改 `WorkspaceClient` 组件
```typescript
// src/app/[locale]/workspace/client.tsx
const [aiSummary, setAiSummary] = useState("");
const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

// 从数据库加载时，同时加载 AI 学习笔记
useEffect(() => {
  if (fileId) {
    const conversion = conversions.get(fileId);
    if (conversion?.result) {
      setContent(conversion.result.content);
      setAiSummary(conversion.result.aiSummary || "");  // ✅ 加载 AI 笔记
    }
  }
}, [fileId, conversions]);

// 生成 AI 学习笔记的函数
const handleGenerateAISummary = async () => {
  // ... 生成逻辑
  // 生成后保存到数据库
  await saveAISummaryToDatabase(fileId, aiSummary);
};
```

**步骤 3**：修改 `AIPreview` 组件为受控组件
```typescript
// src/components/workspace/AIPreview.tsx
interface AIPreviewProps {
  originalContent: string;
  aiContent: string;  // ✅ 从父组件接收
  onGenerate: () => Promise<void>;  // ✅ 生成函数由父组件提供
  isGenerating: boolean;  // ✅ 加载状态由父组件控制
}

export default function AIPreview({
  originalContent,
  aiContent,  // ✅ 受控
  onGenerate,
  isGenerating,
}: AIPreviewProps) {
  // ❌ 移除内部状态
  // const [aiContent, setAiContent] = useState("");
  
  // ❌ 移除自动生成逻辑
  // useEffect(() => { ... }, [...]);
  
  return (
    <div>
      {/* 显示 aiContent */}
      {/* 重新生成按钮调用 onGenerate */}
    </div>
  );
}
```

**步骤 4**：创建保存 API
```typescript
// src/app/api/workspace/ai-summary/route.ts
export async function POST(request: NextRequest) {
  const { fileId, aiSummary } = await request.json();
  
  // 更新 conversions 表
  await db
    .update(conversions)
    .set({
      result: sql`jsonb_set(result, '{aiSummary}', ${JSON.stringify(aiSummary)})`,
    })
    .where(eq(conversions.file_id, fileId));
  
  return NextResponse.json({ success: true });
}
```

#### 方案 2：使用 localStorage 缓存（快速方案）⭐⭐⭐

**核心思路**：
1. 生成后保存到 localStorage
2. 组件挂载时先检查 localStorage
3. 有缓存则使用缓存，无缓存则生成

**优点**：
- ✅ 实现简单，无需修改数据库
- ✅ 解决重复生成问题
- ✅ 刷新页面不丢失

**缺点**：
- ⚠️ 无法跨设备访问
- ⚠️ localStorage 有大小限制（5-10MB）
- ⚠️ 用户清除浏览器数据会丢失

**实现代码**：
```typescript
// src/components/workspace/AIPreview.tsx
useEffect(() => {
  // 先检查 localStorage
  const cacheKey = `ai-summary-${originalContent.substring(0, 100)}`;  // 使用内容哈希作为 key
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    setAiContent(cached);
    setHasGenerated(true);
    return;
  }
  
  // 无缓存则生成
  if (originalContent && !hasGenerated && !isGenerating && !aiContent) {
    generateSummary().then((content) => {
      // 保存到 localStorage
      localStorage.setItem(cacheKey, content);
    });
  }
}, [originalContent]);
```

#### 方案 3：保持组件挂载（CSS 隐藏）⭐⭐⭐⭐

**核心思路**：
1. 不卸载 `AIPreview` 组件，只用 CSS 隐藏
2. 组件状态保持，不会重置

**优点**：
- ✅ 实现简单，修改最小
- ✅ 解决重复生成问题
- ✅ 无需数据库或 localStorage

**缺点**：
- ⚠️ 刷新页面仍会丢失
- ⚠️ 组件始终挂载，占用内存

**实现代码**：
```typescript
// src/app/[locale]/workspace/client.tsx
{workspaceMode === 'document' && (
  <div className="w-1/2 border-r">
    {/* ✅ 始终渲染，用 CSS 控制显示 */}
    <div className={useAIPreview ? 'block' : 'hidden'}>
      <AIPreview originalContent={content} />
    </div>
    <div className={!useAIPreview ? 'block' : 'hidden'}>
      <MarkdownPreview content={content} />
    </div>
  </div>
)}
```

---

## 🎯 推荐实施方案

### 综合方案：方案 1（数据库） + 方案 3（CSS 隐藏）

**实施步骤**：

1. **短期修复**（立即实施）：
   - 使用方案 3（CSS 隐藏）快速解决重复生成问题
   - 修改时间：5 分钟

2. **长期优化**（后续实施）：
   - 实施方案 1（数据库持久化）
   - 扩展 `conversions.result` 字段
   - 创建保存/读取 API
   - 修改时间：30-60 分钟

3. **聊天记录存储**（可选）：
   - 创建 `chat_sessions` 表
   - 实现聊天记录保存/读取
   - 修改时间：60-90 分钟

---

## 📝 下一步行动

1. ✅ **立即修复**：使用 CSS 隐藏方案解决重复生成
2. ⏳ **数据库扩展**：添加 AI 学习笔记字段
3. ⏳ **API 开发**：创建保存/读取 API
4. ⏳ **聊天记录**：创建聊天会话表（可选）

是否开始实施修复方案？

