# 🌐 浏览器调试完整指南

本指南将教您如何使用浏览器开发者工具诊断 Workspace 数据保存问题。

---

## 🚀 快速开始

### 打开开发者工具

**Windows/Linux**：
- Chrome/Edge: `F12` 或 `Ctrl + Shift + I`
- Firefox: `F12` 或 `Ctrl + Shift + I`

**macOS**：
- Chrome/Edge: `Cmd + Option + I`
- Firefox: `Cmd + Option + I`

---

## 📋 调试步骤

### Step 1: 检查 fileId 参数（最重要！）

#### 1.1 查看 URL

**当前 URL 应该是**：
```
http://localhost:3000/workspace?fileId=abc123-def456-ghi789
```

**如果 URL 是这样的，说明有问题**：
```
http://localhost:3000/workspace
```

#### 1.2 在 Console 中验证

1. 打开开发者工具（F12）
2. 切换到 **Console** 标签
3. 输入以下代码并按 Enter：

```javascript
new URLSearchParams(window.location.search).get('fileId')
```

**预期结果**：
```javascript
// ✅ 正确：返回一个字符串
"abc123-def456-ghi789"

// ❌ 错误：返回 null
null
```

**如果返回 null**：
- 问题确认：fileId 参数缺失
- 解决方案：确保从文档转换页面正确跳转
- 临时测试：手动在 URL 中添加 `?fileId=test123`

---

### Step 2: 检查 API 请求

#### 2.1 准备工作

1. 打开开发者工具（F12）
2. 切换到 **Network** 标签
3. ✅ **重要**：勾选 "Preserve log"（保留日志）
4. 清空现有日志（点击 🚫 图标）

#### 2.2 触发保存操作

执行以下任一操作：
- 生成 AI 学习笔记（切换到 AI Preview 模式）
- 发送聊天消息
- 生成闪卡

#### 2.3 查找 API 请求

在 Network 标签中查找以下请求：

| 功能 | API 路径 | 方法 | 预期状态码 |
|------|---------|------|-----------|
| AI 学习笔记 | `/api/workspace/ai-summary` | POST | 200 |
| 聊天会话 | `/api/workspace/chat-session` | POST | 200 |
| 闪卡保存 | `/api/flashcards` | POST | 200 |

#### 2.4 检查请求详情

**点击请求后，查看以下标签**：

##### Headers 标签
```
General:
  Request URL: http://localhost:3000/api/flashcards
  Request Method: POST
  Status Code: 200 OK  ← ✅ 应该是 200

Request Headers:
  Content-Type: application/json
```

**如果状态码不是 200**：
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: API 路由不存在
- `500 Internal Server Error`: 服务器错误

##### Payload 标签
```json
{
  "fileId": "abc123-def456",  ← ✅ 应该存在且不为空
  "flashcards": [
    {
      "question": "What is...",
      "answer": "It is...",
      "explanation": "..."
    }
  ]
}
```

**检查要点**：
- ✅ `fileId` 字段存在
- ✅ `fileId` 不为 `null` 或 `undefined`
- ✅ `flashcards` 数组不为空

##### Response 标签

**成功响应**：
```json
{
  "success": true,
  "message": "Flashcards saved successfully",
  "data": {
    "flashcards": [...],
    "count": 10,
    "expiresAt": null
  }
}
```

**失败响应示例**：

```json
// 错误 1: fileId 缺失
{
  "error": "Missing required fields: fileId, flashcards (array)"
}

// 错误 2: 转换记录不存在
{
  "error": "Conversion not found"
}

// 错误 3: 数据库错误
{
  "error": "Failed to save flashcards",
  "details": "relation \"flashcards\" does not exist"
}

// 错误 4: RLS 策略阻止
{
  "error": "Failed to save flashcards",
  "details": "new row violates row-level security policy"
}
```

---

### Step 3: 检查 Console 日志

#### 3.1 查找成功日志

在 Console 标签中查找以下日志：

```javascript
// ✅ AI 学习笔记保存成功
"AI summary saved to database"

// ✅ 聊天会话保存成功
"Chat history saved"
"Chat history loaded: 5 messages"

// ✅ 闪卡保存成功
"Flashcards saved: 10"
"Flashcards loaded from database: 10"
```

#### 3.2 查找错误日志

```javascript
// ❌ 保存失败
"Save flashcards error: Error: Failed to save flashcards"
"Failed to save AI summary: Error: Missing required fields"
"Save chat history error: Error: Failed to save chat history"

// ❌ 加载失败
"Load flashcards error: Error: Failed to load flashcards"
"Load chat history error: Error: Failed to load chat history"
```

#### 3.3 查看详细错误信息

点击错误日志展开，查看完整的错误堆栈：

```javascript
Error: Failed to save flashcards
    at FlashcardsView.tsx:82
    at async saveFlashcards (FlashcardsView.tsx:67)
```

---

### Step 4: 实时监控数据流

#### 4.1 添加调试断点

1. 切换到 **Sources** 标签
2. 在左侧文件树中找到：
   - `src/components/workspace/FlashcardsView.tsx`
   - `src/components/workspace/ChatInterface.tsx`
   - `src/components/workspace/AIPreview.tsx`
3. 在保存函数处添加断点：
   - `FlashcardsView.tsx` 第 67 行（`saveFlashcards` 函数）
   - `ChatInterface.tsx` 第 74 行（`saveChatHistory` 函数）
   - `AIPreview.tsx` 第 96 行（保存 AI 摘要）

#### 4.2 逐步调试

当代码执行到断点时：
1. 检查变量值：
   - `fileId`: 应该是字符串，不是 `null`
   - `flashcards`: 应该是数组，不为空
   - `messages`: 应该是数组，不为空
2. 使用 "Step Over" (F10) 逐行执行
3. 观察 `response` 对象的值

---

## 🔍 常见问题诊断

### 问题 1: fileId 为 null

**症状**：
```javascript
// Console 输出
new URLSearchParams(window.location.search).get('fileId')
// 返回: null
```

**原因**：
- URL 中缺少 `fileId` 参数
- 从文档转换页面跳转时未传递 `fileId`

**解决方案**：
1. 检查文档转换页面的跳转代码
2. 确保跳转时包含 `fileId` 参数：
   ```typescript
   router.push(`/workspace?fileId=${conversionId}`);
   ```
3. 临时测试：手动在 URL 中添加 `?fileId=test123`

---

### 问题 2: API 返回 404

**症状**：
```
Network 标签显示：
Status Code: 404 Not Found
```

**原因**：
- API 路由不存在
- API 路径拼写错误

**检查**：
1. 确认以下文件存在：
   - `src/app/api/flashcards/route.ts`
   - `src/app/api/workspace/chat-session/route.ts`
   - `src/app/api/workspace/ai-summary/route.ts`
2. 检查 Network 标签中的 Request URL 是否正确

---

### 问题 3: API 返回 400

**症状**：
```json
{
  "error": "Missing required fields: fileId"
}
```

**原因**：
- 请求体中缺少必填字段
- `fileId` 为 `null` 或 `undefined`

**检查**：
1. 在 Network 标签的 Payload 中查看请求体
2. 确认 `fileId` 字段存在且不为空
3. 在 Console 中检查 `fileId` 变量的值

---

### 问题 4: API 返回 500

**症状**：
```json
{
  "error": "Failed to save flashcards",
  "details": "relation \"flashcards\" does not exist"
}
```

**原因**：
- 数据库表不存在
- 数据库连接错误

**解决方案**：
1. 在 Supabase Dashboard 中检查表是否存在
2. 执行 `src/db/migrations/create_all_tables.sql`
3. 检查 `.env.development` 中的 `DATABASE_URL`

---

### 问题 5: RLS 策略阻止

**症状**：
```json
{
  "error": "Failed to save flashcards",
  "details": "new row violates row-level security policy"
}
```

**原因**：
- RLS 策略配置错误
- INSERT 策略缺失或逻辑错误

**解决方案**：
1. 在 Supabase Dashboard 中检查 RLS 策略
2. 执行 `src/db/migrations/rls_all_tables.sql`
3. 验证 INSERT 策略是否允许匿名用户

---

## 📊 调试检查清单

### 基础检查
- [ ] 打开开发者工具（F12）
- [ ] 切换到 Network 标签
- [ ] 勾选 "Preserve log"
- [ ] 清空现有日志

### fileId 检查
- [ ] URL 中包含 `?fileId=xxx` 参数
- [ ] Console 中 `fileId` 不为 `null`
- [ ] Payload 中 `fileId` 字段存在

### API 请求检查
- [ ] 找到对应的 API 请求
- [ ] 状态码为 200
- [ ] Response 中 `success: true`
- [ ] 没有错误信息

### Console 日志检查
- [ ] 看到成功日志（"saved to database"）
- [ ] 没有错误日志（"error:"）
- [ ] 没有警告日志（"warning:"）

### 数据验证
- [ ] 在 Supabase Dashboard 中查看数据
- [ ] 刷新页面后数据仍然存在
- [ ] 数据与前端显示一致

---

## 🎯 快速诊断流程图

```
开始
  ↓
检查 URL 中是否有 fileId?
  ├─ 否 → 问题确认：fileId 缺失 → 修复跳转逻辑
  └─ 是 ↓
检查 Network 标签中是否有 API 请求?
  ├─ 否 → 问题确认：API 未调用 → 检查前端代码
  └─ 是 ↓
检查 API 状态码是否为 200?
  ├─ 否 → 查看 Response 错误信息 → 根据错误修复
  └─ 是 ↓
检查 Response 中 success 是否为 true?
  ├─ 否 → 查看错误信息 → 根据错误修复
  └─ 是 ↓
检查 Supabase 中是否有数据?
  ├─ 否 → 问题确认：数据库连接错误 → 检查 DATABASE_URL
  └─ 是 ↓
问题解决！✅
```

---

## 💡 高级调试技巧

### 技巧 1: 使用 Console 监控变量

```javascript
// 在 Console 中输入
window.addEventListener('beforeunload', () => {
  console.log('fileId:', new URLSearchParams(window.location.search).get('fileId'));
});
```

### 技巧 2: 拦截 fetch 请求

```javascript
// 在 Console 中输入
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args).then(response => {
    console.log('Fetch response:', response);
    return response;
  });
};
```

### 技巧 3: 查看 localStorage

```javascript
// 在 Console 中输入
console.log('localStorage:', localStorage);
```

---

## 📚 相关文档

- `WORKSPACE_DATA_SAVE_DIAGNOSTIC.md` - 完整诊断指南
- `QUICK_REFERENCE_RLS.md` - RLS 快速参考
- `SUPABASE_DATABASE_SETUP_GUIDE.md` - 数据库配置指南

---

**文档版本**: 1.0  
**最后更新**: 2025-11-05  
**适用浏览器**: Chrome, Edge, Firefox

