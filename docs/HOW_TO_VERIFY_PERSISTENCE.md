# 📖 如何验证数据持久化功能

本指南将帮助您验证 Flashcards、Chat Sessions 和 AI Summary 的数据是否正确保存到 Supabase 数据库。

---

## 🚀 快速验证（3 分钟）

### 方法 1: 使用浏览器测试页面（最简单）

1. **启动开发服务器**:
   ```bash
   pnpm dev
   ```

2. **打开测试页面**:
   ```
   http://localhost:3000/test-persistence
   ```

3. **点击 "运行所有测试" 按钮**

4. **查看结果**:
   - ✅ 所有绿色勾 = 功能正常
   - ❌ 有红色叉 = 需要检查

![测试页面示例](https://via.placeholder.com/800x400?text=Test+Persistence+Page)

---

## 🔍 详细验证步骤

### Step 1: 测试 Flashcards 保存

1. **访问 Workspace 页面**:
   ```
   http://localhost:3000/en/workspace?fileId=my-test-file
   ```
   > 注意: `fileId` 参数很重要，用于关联数据

2. **上传一个文档**（或粘贴一些文本）

3. **打开浏览器控制台**:
   - 按 `F12` 键
   - 切换到 `Console` 标签

4. **点击 "Flashcards" 标签**

5. **点击 "生成闪卡" 按钮**

6. **观察控制台输出**:
   ```
   ✅ 应该看到: "Flashcards saved to database: 12"
   ```

7. **刷新页面** (F5)

8. **再次观察控制台**:
   ```
   ✅ 应该看到: "Flashcards loaded from database: 12"
   ```

9. **如果看到这两条日志** = 数据已成功保存和加载！

---

### Step 2: 测试 Chat Session 保存

1. **在同一个 Workspace 页面**（使用相同的 `fileId`）

2. **点击 "AI 助手" 标签**

3. **发送一条消息**（例如: "你好"）

4. **等待 AI 回复**

5. **观察控制台输出**:
   ```
   ✅ 应该看到: "Chat history saved"
   ```

6. **刷新页面** (F5)

7. **观察控制台**:
   ```
   ✅ 应该看到: "Chat history loaded: 2 messages"
   ```

8. **检查聊天记录是否还在** = 数据已成功保存！

---

### Step 3: 测试 AI Summary 保存

1. **在同一个 Workspace 页面**

2. **点击 "AI 学习笔记" 标签**

3. **点击 "生成学习笔记" 按钮**

4. **等待生成完成**

5. **观察控制台输出**:
   ```
   ✅ 应该看到: "AI summary saved successfully"
   ```

6. **刷新页面** (F5)

7. **检查 AI 笔记是否还在** = 数据已成功保存！

---

## 🛠️ 使用诊断工具

### 工具 1: 数据库诊断脚本

**功能**: 直接测试数据库连接和 RLS 策略

**运行**:
```bash
npx tsx scripts/diagnose-database.ts
```

**预期输出**:
```
✅ 数据库连接成功
✅ conversions - 表存在
✅ chat_sessions - 表存在
✅ flashcards - 表存在
✅ flashcards - 插入成功
✅ chat_sessions - 插入成功
✅ conversions - 插入成功
```

---

### 工具 2: API 端点测试脚本

**功能**: 测试所有 API 端点

**运行**:
```bash
# 终端 1: 启动开发服务器
pnpm dev

# 终端 2: 运行测试
npx tsx scripts/test-api-endpoints.ts
```

**预期输出**:
```
1️⃣  测试 Flashcards API...
   ✅ 保存成功: 2 个闪卡
   ✅ 读取成功: 2 个闪卡

2️⃣  测试 Chat Session API...
   ✅ 保存成功
   ✅ 读取成功: 2 条消息

3️⃣  测试 AI Summary API...
   ✅ 保存成功
   ✅ 读取成功
```

---

## 🔎 在 Supabase Dashboard 中验证

### 方法: 直接查看数据库

1. **登录 Supabase Dashboard**:
   ```
   https://supabase.com/dashboard
   ```

2. **选择您的项目**

3. **点击左侧菜单的 "Table Editor"**

4. **查看 `flashcards` 表**:
   - 应该能看到您生成的闪卡数据
   - 检查 `file_id` 字段是否匹配

5. **查看 `chat_sessions` 表**:
   - 应该能看到聊天会话数据
   - 检查 `messages` 字段（JSON 格式）

6. **查看 `conversions` 表**:
   - 应该能看到文档转换记录
   - 检查 `result` 字段中的 `aiSummary`

---

## 🐛 常见问题排查

### 问题 1: 控制台没有看到保存日志

**可能原因**:
- 保存功能被静默失败了
- 网络请求失败了

**解决方法**:
1. 打开 F12 开发者工具
2. 切换到 `Network` 标签
3. 筛选 `Fetch/XHR`
4. 查找 `/api/flashcards` 或 `/api/workspace/chat-session` 请求
5. 检查请求状态码（应该是 200）
6. 检查响应内容（应该包含 `"success": true`）

---

### 问题 2: 刷新后数据消失了

**可能原因**:
- 使用了不同的 `fileId`
- 匿名用户数据已过期（24 小时）

**解决方法**:
1. 确保使用相同的 `fileId` 参数
2. 登录后使用（数据将永久保存）
3. 检查 URL 中的 `fileId` 参数

---

### 问题 3: API 请求返回 500 错误

**可能原因**:
- 数据库表不存在
- RLS 策略配置错误
- Supabase 配置错误

**解决方法**:
1. 运行诊断脚本: `npx tsx scripts/diagnose-database.ts`
2. 检查 `.env.local` 中的 Supabase 配置
3. 在 Supabase Dashboard 中检查表是否存在
4. 检查 RLS 策略是否启用

---

### 问题 4: 数据库中没有数据

**可能原因**:
- 保存请求失败了
- RLS 策略阻止了插入

**解决方法**:
1. 检查浏览器控制台的错误
2. 检查 Network 请求的响应
3. 运行诊断脚本验证 RLS 策略
4. 在 Supabase Dashboard 中手动插入测试数据

---

## 📊 验证清单

使用此清单确保所有功能正常：

### 数据库配置
- [ ] `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL` 已配置
- [ ] `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置
- [ ] 运行 `npx tsx scripts/diagnose-database.ts` 全部通过

### 数据库表
- [ ] `flashcards` 表存在
- [ ] `chat_sessions` 表存在
- [ ] `conversions` 表存在

### RLS 策略
- [ ] 匿名用户可以插入 `flashcards`
- [ ] 匿名用户可以插入 `chat_sessions`
- [ ] 匿名用户可以插入 `conversions`

### API 端点
- [ ] `POST /api/flashcards` 返回 200
- [ ] `GET /api/flashcards?fileId=xxx` 返回 200
- [ ] `POST /api/workspace/chat-session` 返回 200
- [ ] `GET /api/workspace/chat-session?fileId=xxx` 返回 200

### 前端功能
- [ ] 生成 Flashcards 后控制台显示 "saved to database"
- [ ] 刷新页面后 Flashcards 仍然存在
- [ ] 发送聊天消息后控制台显示 "Chat history saved"
- [ ] 刷新页面后聊天记录仍然存在
- [ ] 生成 AI 笔记后控制台显示 "saved successfully"
- [ ] 刷新页面后 AI 笔记仍然存在

---

## 🎯 成功标准

如果满足以下条件，说明数据持久化功能完全正常：

1. ✅ 诊断脚本全部通过
2. ✅ 浏览器测试页面全部通过
3. ✅ 实际使用时数据能够保存和加载
4. ✅ Supabase Dashboard 中能看到数据
5. ✅ 刷新页面后数据仍然存在

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题，请提供以下信息：

1. **诊断脚本输出**:
   ```bash
   npx tsx scripts/diagnose-database.ts
   ```

2. **浏览器控制台截图**（F12 Console 标签）

3. **Network 请求截图**（F12 Network 标签）

4. **Supabase Dashboard 截图**（Table Editor）

5. **具体的错误信息**

---

## 📚 相关文档

- `PERSISTENCE_FIX_SUMMARY.md` - 修复总结
- `PERSISTENCE_DIAGNOSTIC_REPORT.md` - 详细诊断报告
- `RLS_POLICIES_REFERENCE.md` - RLS 策略参考

