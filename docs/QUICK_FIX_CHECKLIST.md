# ⚡ Workspace 数据保存问题 - 快速修复清单

**预计解决时间**: 5-15 分钟

---

## 🎯 3 步快速诊断

### Step 1: 检查 fileId（1 分钟）⭐ 最重要

**操作**：
1. 按 `F12` 打开开发者工具
2. 在 Console 中输入：
   ```javascript
   new URLSearchParams(window.location.search).get('fileId')
   ```

**结果判断**：
- ✅ 返回字符串（如 `"abc123"`）→ 继续 Step 2
- ❌ 返回 `null` → **问题确认：fileId 缺失**

**如果 fileId 缺失**：
```
临时测试：在 URL 中手动添加 ?fileId=test123
永久修复：检查文档转换页面的跳转代码
```

---

### Step 2: 检查数据库连接（2 分钟）

**操作**：
```bash
# 查看 .env.development 文件
cat .env.development | grep DATABASE_URL
```

**结果判断**：
```bash
# ✅ 正确：包含 supabase.co
DATABASE_URL="postgresql://...@db.xxxxx.supabase.co:5432/postgres"

# ❌ 错误：指向 localhost
DATABASE_URL="postgresql://...@localhost:5432/mydb"
```

**如果配置错误**：
1. 登录 Supabase Dashboard → Settings → Database
2. 复制 Connection string (URI 格式)
3. 更新 `.env.development`
4. 重启服务器：`Ctrl+C` 然后 `pnpm dev`

---

### Step 3: 验证数据库配置（2 分钟）

**操作**：
在 Supabase Dashboard → SQL Editor 中执行：
```sql
-- 复制并执行整个文件
src/db/migrations/verify_database_config.sql
```

**查看结果**：
- ✅ 表数量：11 个
- ✅ RLS 启用：11 个
- ✅ 策略总数：30 个

**如果验证失败**：
- 表缺失 → 执行 `create_all_tables.sql`
- RLS 未启用 → 执行 `rls_all_tables.sql`
- 策略缺失 → 执行 `rls_all_tables.sql`

---

## 🔍 浏览器调试（5 分钟）

### 检查 API 请求

1. 按 `F12` 打开开发者工具
2. 切换到 **Network** 标签
3. ✅ 勾选 "Preserve log"
4. 触发保存操作（生成 AI 笔记/聊天/闪卡）
5. 查找以下请求：

| 功能 | API 路径 | 预期状态 |
|------|---------|---------|
| AI 学习笔记 | `/api/workspace/ai-summary` | 200 |
| 聊天会话 | `/api/workspace/chat-session` | 200 |
| 闪卡保存 | `/api/flashcards` | 200 |

### 检查请求详情

**点击请求 → Payload 标签**：
```json
{
  "fileId": "abc123",  // ✅ 必须存在且不为空
  "flashcards": [...]
}
```

**点击请求 → Response 标签**：
```json
// ✅ 成功
{"success": true, "message": "..."}

// ❌ 失败
{"error": "Missing required fields: fileId"}
```

---

## 📋 常见错误速查

### 错误 1: fileId 为 null

**症状**：
```javascript
new URLSearchParams(window.location.search).get('fileId')
// 返回: null
```

**修复**：
```
1. 检查 URL 是否包含 ?fileId=xxx
2. 临时测试：手动添加 ?fileId=test123
3. 永久修复：检查跳转代码
```

---

### 错误 2: API 返回 400

**症状**：
```json
{"error": "Missing required fields: fileId"}
```

**修复**：
```
1. 检查 Payload 中 fileId 是否存在
2. 检查 Console 中 fileId 变量的值
3. 确保 fileId 不为 null 或 undefined
```

---

### 错误 3: API 返回 404

**症状**：
```
Status Code: 404 Not Found
```

**修复**：
```
1. 确认 API 路由文件存在：
   - src/app/api/flashcards/route.ts
   - src/app/api/workspace/chat-session/route.ts
   - src/app/api/workspace/ai-summary/route.ts
2. 检查 Request URL 是否正确
```

---

### 错误 4: API 返回 500

**症状**：
```json
{"error": "Failed to save", "details": "relation \"flashcards\" does not exist"}
```

**修复**：
```
1. 在 Supabase 中检查表是否存在
2. 执行 create_all_tables.sql
3. 验证 DATABASE_URL 配置
```

---

### 错误 5: RLS 策略阻止

**症状**：
```json
{"error": "...", "details": "row-level security policy"}
```

**修复**：
```
1. 在 Supabase SQL Editor 中执行：
   DROP POLICY IF EXISTS "Users can insert flashcards" ON flashcards;
2. 重新执行 rls_all_tables.sql
3. 验证策略是否创建成功
```

---

## ✅ 验证修复成功

### 测试 1: AI 学习笔记
```
1. 打开 Workspace（确保 URL 有 fileId）
2. 切换到 AI Preview 模式
3. 等待生成完成
4. Console 显示: "AI summary saved to database"
5. 刷新页面，内容自动加载 ✅
```

### 测试 2: 聊天会话
```
1. 发送聊天消息
2. 等待 2 秒
3. Console 显示: "Chat history saved"
4. 刷新页面，聊天记录自动加载 ✅
```

### 测试 3: 闪卡
```
1. 切换到 Flashcards 模式
2. 点击 "生成闪卡"
3. 等待生成完成
4. Console 显示: "Flashcards saved: 10"
5. 刷新页面，闪卡自动加载 ✅
```

### 测试 4: Supabase 数据
```
在 Supabase Dashboard → Table Editor 中：
1. flashcards 表 → 有新数据 ✅
2. chat_sessions 表 → 有新数据 ✅
3. conversions 表 → result 字段包含 aiSummary ✅
```

---

## 📊 问题概率分布

| 原因 | 概率 | 检查时间 | 修复难度 |
|------|------|---------|---------|
| fileId 参数缺失 | 50% | 1 分钟 | ⭐ 简单 |
| DATABASE_URL 配置错误 | 30% | 2 分钟 | ⭐⭐ 中等 |
| RLS 策略阻止 | 10% | 5 分钟 | ⭐⭐ 中等 |
| 表不存在 | 5% | 2 分钟 | ⭐ 简单 |
| API 路由错误 | 3% | 10 分钟 | ⭐⭐⭐ 困难 |
| 其他原因 | 2% | 变化 | 变化 |

---

## 🛠️ SQL 快速命令

### 检查表是否存在
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 检查 RLS 状态
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```

### 检查策略数量
```sql
SELECT tablename, COUNT(*) FROM pg_policies 
WHERE schemaname = 'public' GROUP BY tablename;
```

### 测试数据插入
```sql
-- 测试 flashcards
INSERT INTO flashcards (uuid, file_id, question, answer, user_uuid)
VALUES ('test-uuid', 'test-file', 'Q', 'A', NULL);

-- 验证
SELECT * FROM flashcards WHERE uuid = 'test-uuid';

-- 清理
DELETE FROM flashcards WHERE uuid = 'test-uuid';
```

---

## 📚 详细文档索引

| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| `WORKSPACE_SAVE_ISSUE_SUMMARY.md` | 完整解决方案 | 10 分钟 |
| `WORKSPACE_DATA_SAVE_DIAGNOSTIC.md` | 详细诊断指南 | 15 分钟 |
| `BROWSER_DEBUG_GUIDE.md` | 浏览器调试教程 | 10 分钟 |
| `verify_database_config.sql` | 数据库验证脚本 | 1 分钟 |
| `QUICK_FIX_CHECKLIST.md` | 本文档（快速参考） | 5 分钟 |

---

## 🆘 获取帮助

如果以上步骤都无法解决问题，请提供：

1. ✅ 浏览器 Console 的完整错误日志
2. ✅ Network 标签中失败的 API 请求详情
3. ✅ `verify_database_config.sql` 的执行结果
4. ✅ `.env.development` 中的 `DATABASE_URL`（隐藏密码）

---

**快速参考版本**: 1.0  
**最后更新**: 2025-11-05  
**打印友好**: ✅

