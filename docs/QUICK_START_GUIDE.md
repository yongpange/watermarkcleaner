# 🚀 快速启动指南

## 📋 前置条件

确保已经配置好：
- ✅ Supabase 数据库连接（`DATABASE_URL` 在 `.env.local`）
- ✅ DeepSeek API 密钥（`DEEPSEEK_API_KEY` 在 `.env.local`）

---

## 🗄️ 步骤 1：创建数据库表

### 方法 1：使用 Supabase Dashboard（推荐）

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 执行以下 SQL 语句：

```sql
-- 创建 chat_sessions 表
CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "uuid" varchar(255) NOT NULL UNIQUE,
  "user_uuid" varchar(255),
  "file_id" varchar(255) NOT NULL,
  "messages" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "expires_at" timestamp with time zone,
  "message_count" integer DEFAULT 0 NOT NULL,
  "last_message_at" timestamp with time zone
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "chat_sessions_user_uuid_idx" ON "chat_sessions" ("user_uuid");
CREATE INDEX IF NOT EXISTS "chat_sessions_file_id_idx" ON "chat_sessions" ("file_id");
CREATE INDEX IF NOT EXISTS "chat_sessions_created_at_idx" ON "chat_sessions" ("created_at");

-- 添加注释
COMMENT ON TABLE "chat_sessions" IS 'Stores AI assistant chat history for each document';
COMMENT ON COLUMN "chat_sessions"."messages" IS 'Array of {role: "user"|"assistant", content: string, timestamp: string}';
COMMENT ON COLUMN "chat_sessions"."expires_at" IS 'Expiry time for anonymous user sessions (24 hours from creation)';
```

### 方法 2：使用 Drizzle Push（如果方法 1 失败）

```bash
pnpm db:push
```

如果卡住，按 `Ctrl+C` 终止，然后使用方法 1。

---

## 🚀 步骤 2：启动开发服务器

```bash
pnpm dev
```

服务器将在 http://localhost:3000 启动。

---

## 🧪 步骤 3：测试功能

### 测试 AI 学习笔记持久化

1. **上传文档**
   - 访问 http://localhost:3000/en/convert
   - 上传一个文档（PDF、Word、图片等）
   - 等待转换完成

2. **进入 Workspace**
   - 点击 "Advanced Edit" 按钮
   - 等待 AI 学习笔记生成完成（首次生成）

3. **测试切换不重新生成**
   - 点击顶部工具栏的"原始预览"按钮
   - 左侧应该切换为显示原始 Markdown 内容
   - 点击"AI 笔记"按钮
   - ✅ **验证**：左侧应该立即显示 AI 学习笔记，**不会重新生成**

4. **测试刷新不丢失**
   - 刷新浏览器页面（F5）
   - ✅ **验证**：AI 学习笔记应该从数据库恢复，**不会重新生成**

5. **测试模式切换不重新生成**
   - 点击左侧边栏的 "Chatbot" 按钮
   - 切换到全屏聊天模式
   - 点击左侧边栏的 "Document" 按钮
   - 切换回文档模式
   - ✅ **验证**：AI 学习笔记应该立即显示，**不会重新生成**

### 测试聊天历史持久化

1. **发送消息**
   - 在右侧聊天界面输入问题，例如："请总结这篇文档的主要内容"
   - 按 Enter 发送
   - 等待 AI 回复

2. **测试刷新不丢失**
   - 刷新浏览器页面（F5）
   - ✅ **验证**：聊天历史应该从数据库恢复，之前的对话应该显示

3. **测试模式切换不丢失**
   - 点击左侧边栏的 "Chatbot" 按钮
   - ✅ **验证**：聊天历史应该保持不变
   - 点击左侧边栏的 "Document" 按钮
   - ✅ **验证**：聊天历史应该保持不变

4. **测试多轮对话**
   - 继续发送多条消息
   - 等待 2 秒（自动保存防抖时间）
   - 刷新页面
   - ✅ **验证**：所有对话历史应该恢复

---

## 🔍 步骤 4：验证数据库存储

### 验证 AI 学习笔记

1. 打开 Supabase Dashboard
2. 进入 Table Editor
3. 选择 `conversions` 表
4. 找到你的文档记录（通过 `file_id` 查找）
5. 查看 `result` 字段（jsonb）
6. ✅ **验证**：应该包含 `aiSummary` 字段

示例：
```json
{
  "content": "原始 Markdown 内容...",
  "format": "markdown",
  "metadata": {
    "wordCount": 1000,
    "characterCount": 5000
  },
  "aiSummary": "AI 生成的学习笔记内容...",
  "aiSummaryGeneratedAt": "2025-11-02T10:05:00Z",
  "aiSummaryVersion": 1
}
```

### 验证聊天历史

1. 在 Supabase Dashboard 的 Table Editor 中
2. 选择 `chat_sessions` 表
3. 找到你的聊天会话记录（通过 `file_id` 查找）
4. 查看 `messages` 字段（jsonb）
5. ✅ **验证**：应该包含所有聊天消息

示例：
```json
[
  {
    "role": "user",
    "content": "请总结这篇文档的主要内容",
    "timestamp": "2025-11-02T10:00:00Z"
  },
  {
    "role": "assistant",
    "content": "这篇文档主要讨论了...",
    "timestamp": "2025-11-02T10:00:05Z"
  }
]
```

---

## 🐛 常见问题

### 问题 1：AI 学习笔记仍然重复生成

**可能原因**：
- 数据库中没有保存成功
- `fileId` 参数未正确传递

**解决方法**：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签
3. 查找 "AI summary saved to database" 日志
4. 如果没有，检查 Network 标签中的 `/api/workspace/ai-summary` 请求
5. 查看请求是否成功（状态码 200）

### 问题 2：聊天历史没有保存

**可能原因**：
- `chat_sessions` 表未创建
- `fileId` 参数未正确传递

**解决方法**：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签
3. 查找 "Chat history saved" 日志
4. 如果没有，检查 Network 标签中的 `/api/workspace/chat-session` 请求
5. 确认 `chat_sessions` 表已创建（使用步骤 1 的 SQL）

### 问题 3：数据库连接失败

**可能原因**：
- `DATABASE_URL` 配置错误
- Supabase 数据库未启动

**解决方法**：
1. 检查 `.env.local` 中的 `DATABASE_URL`
2. 确保格式正确：`postgresql://user:password@host:port/database`
3. 在 Supabase Dashboard 中确认数据库正在运行

### 问题 4：API 调用失败

**可能原因**：
- DeepSeek API 密钥错误
- API 配额用完

**解决方法**：
1. 检查 `.env.local` 中的 `DEEPSEEK_API_KEY`
2. 在 DeepSeek 控制台检查 API 配额
3. 查看浏览器 Console 中的错误信息

---

## 📊 性能监控

### 监控 API 调用次数

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 过滤 `/api/ai/summarize` 请求
4. ✅ **验证**：首次加载时应该只调用一次
5. ✅ **验证**：切换模式时不应该再次调用

### 监控数据库保存

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 查找以下日志：
   - "AI summary saved to database"
   - "Chat history saved"
4. ✅ **验证**：应该在生成完成后看到这些日志

---

## 🎉 成功标志

如果以下所有测试都通过，说明功能已成功实现：

- ✅ AI 学习笔记只在首次加载时生成一次
- ✅ 切换预览模式时不会重新生成
- ✅ 切换工作区模式时不会重新生成
- ✅ 刷新页面后 AI 学习笔记从数据库恢复
- ✅ 聊天历史自动保存到数据库
- ✅ 刷新页面后聊天历史从数据库恢复
- ✅ 数据库中可以看到 `aiSummary` 和 `messages` 数据

---

## 📚 相关文档

- **功能实现文档**：`AI_PERSISTENCE_IMPLEMENTATION.md`
- **数据存储分析**：`AI_DATA_STORAGE_ANALYSIS.md`
- **数据库迁移文件**：`src/db/migrations/0002_add_ai_fields.sql`

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看浏览器 Console 中的错误信息
2. 查看 Network 标签中的 API 请求
3. 检查 Supabase Dashboard 中的数据库表
4. 查看相关文档了解实现细节

祝测试顺利！🎉

