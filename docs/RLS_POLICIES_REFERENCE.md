# 🛡️ RLS 策略参考文档

本文档详细说明每个数据库表的 Row Level Security (RLS) 策略设计。

---

## 📊 策略总览

| 表名 | SELECT | INSERT | UPDATE | DELETE | 匿名支持 |
|------|--------|--------|--------|--------|---------|
| users | ✅ | ❌ | ✅ | ❌ | ❌ |
| orders | ✅ | ❌ | ❌ | ❌ | ❌ |
| apikeys | ✅ | ✅ | ✅ | ✅ | ❌ |
| credits | ✅ | ❌ | ❌ | ❌ | ❌ |
| posts | ✅ | ❌ | ❌ | ❌ | ❌ |
| affiliates | ✅ | ❌ | ❌ | ❌ | ❌ |
| feedbacks | ✅ | ✅ | ✅ | ✅ | ✅ |
| conversions | ✅ | ✅ | ✅ | ✅ | ✅ (24h) |
| user_preferences | ✅ | ✅ | ✅ | ✅ | ❌ |
| chat_sessions | ✅ | ✅ | ✅ | ✅ | ✅ (24h) |
| flashcards | ✅ | ✅ | ✅ | ✅ | ✅ (24h) |

---

## 📋 详细策略说明

### 1. USERS 表 - 用户信息

**策略数量**: 2

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = uuid);
```
**说明**：用户只能查看自己的个人信息

#### UPDATE 策略
```sql
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = uuid);
```
**说明**：用户只能更新自己的个人信息

**为什么没有 INSERT/DELETE？**
- INSERT：用户注册由系统管理（NextAuth.js）
- DELETE：用户删除由管理员管理

---

### 2. ORDERS 表 - 订单记录

**策略数量**: 1

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid()::text = user_uuid);
```
**说明**：用户只能查看自己的订单

**为什么只有 SELECT？**
- INSERT：订单创建由 Stripe webhook 管理
- UPDATE/DELETE：订单修改由系统管理

---

### 3. APIKEYS 表 - API 密钥

**策略数量**: 4（完整 CRUD）

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own API keys"
  ON apikeys FOR SELECT
  USING (auth.uid()::text = user_uuid);
```

#### INSERT 策略
```sql
CREATE POLICY "Users can create their own API keys"
  ON apikeys FOR INSERT
  WITH CHECK (auth.uid()::text = user_uuid);
```

#### UPDATE 策略
```sql
CREATE POLICY "Users can update their own API keys"
  ON apikeys FOR UPDATE
  USING (auth.uid()::text = user_uuid);
```

#### DELETE 策略
```sql
CREATE POLICY "Users can delete their own API keys"
  ON apikeys FOR DELETE
  USING (auth.uid()::text = user_uuid);
```

**说明**：用户可以完全管理自己的 API 密钥

---

### 4. CREDITS 表 - 积分交易

**策略数量**: 1

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own credits"
  ON credits FOR SELECT
  USING (auth.uid()::text = user_uuid);
```
**说明**：用户只能查看自己的积分记录

**为什么只有 SELECT？**
- INSERT/UPDATE/DELETE：积分交易由系统管理

---

### 5. POSTS 表 - 博客文章

**策略数量**: 1

#### SELECT 策略
```sql
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  USING (status = 'published');
```
**说明**：所有人（包括未登录用户）可以查看已发布的文章

**为什么只有 SELECT？**
- INSERT/UPDATE/DELETE：文章管理由管理员负责

---

### 6. AFFILIATES 表 - 联盟营销

**策略数量**: 1

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own affiliate records"
  ON affiliates FOR SELECT
  USING (auth.uid()::text = user_uuid);
```
**说明**：用户只能查看自己的联盟营销记录

**为什么只有 SELECT？**
- INSERT/UPDATE/DELETE：联盟记录由系统管理

---

### 7. FEEDBACKS 表 - 用户反馈

**策略数量**: 4（完整 CRUD + 匿名支持）

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own feedbacks"
  ON feedbacks FOR SELECT
  USING (
    auth.uid()::text = user_uuid
    OR user_uuid IS NULL  -- 匿名反馈
  );
```
**说明**：用户可以查看自己的反馈，包括匿名提交的反馈

#### INSERT 策略
```sql
CREATE POLICY "Users can create feedbacks"
  ON feedbacks FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_uuid
    OR user_uuid IS NULL  -- 允许匿名反馈
  );
```
**说明**：允许匿名用户提交反馈

#### UPDATE 策略
```sql
CREATE POLICY "Users can update their own feedbacks"
  ON feedbacks FOR UPDATE
  USING (auth.uid()::text = user_uuid);
```
**说明**：只有登录用户可以更新自己的反馈

#### DELETE 策略
```sql
CREATE POLICY "Users can delete their own feedbacks"
  ON feedbacks FOR DELETE
  USING (auth.uid()::text = user_uuid);
```
**说明**：只有登录用户可以删除自己的反馈

---

### 8. CONVERSIONS 表 - 文档转换（支持匿名用户）

**策略数量**: 4（完整 CRUD + 匿名支持 + 24h 过期）

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own conversions"
  ON conversions FOR SELECT
  USING (
    auth.uid()::text = user_uuid
    OR
    (
      user_uuid IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
```
**说明**：
- 登录用户：查看自己的转换记录
- 匿名用户：查看未过期的匿名转换（24 小时内）

#### INSERT 策略
```sql
CREATE POLICY "Users can create conversions"
  ON conversions FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_uuid
    OR user_uuid IS NULL
  );
```
**说明**：允许匿名用户创建转换记录

#### UPDATE 策略
```sql
CREATE POLICY "Users can update their own conversions"
  ON conversions FOR UPDATE
  USING (
    auth.uid()::text = user_uuid
    OR
    (
      user_uuid IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
```
**说明**：匿名用户可以在 24 小时内更新自己的转换记录

#### DELETE 策略
```sql
CREATE POLICY "Users can delete their own conversions"
  ON conversions FOR DELETE
  USING (auth.uid()::text = user_uuid);
```
**说明**：只有登录用户可以删除转换记录

---

### 9. USER_PREFERENCES 表 - 用户偏好

**策略数量**: 4（完整 CRUD）

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid()::text = user_uuid);
```

#### INSERT 策略
```sql
CREATE POLICY "Users can create their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_uuid);
```

#### UPDATE 策略
```sql
CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid()::text = user_uuid);
```

#### DELETE 策略
```sql
CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid()::text = user_uuid);
```

**说明**：用户可以完全管理自己的偏好设置

---

### 10. CHAT_SESSIONS 表 - AI 聊天会话（支持匿名用户）

**策略数量**: 4（完整 CRUD + 匿名支持 + 24h 过期）

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own chat sessions"
  ON chat_sessions FOR SELECT
  USING (
    auth.uid()::text = user_uuid
    OR
    (
      user_uuid IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
```

#### INSERT 策略
```sql
CREATE POLICY "Users can create chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_uuid
    OR user_uuid IS NULL
  );
```

#### UPDATE 策略
```sql
CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (
    auth.uid()::text = user_uuid
    OR
    (
      user_uuid IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
```

#### DELETE 策略
```sql
CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid()::text = user_uuid);
```

**说明**：与 conversions 表类似，支持匿名用户 24 小时访问

---

### 11. FLASHCARDS 表 - 学习闪卡（支持匿名用户）

**策略数量**: 4（完整 CRUD + 匿名支持 + 24h 过期）

#### SELECT 策略
```sql
CREATE POLICY "Users can view their own flashcards"
  ON flashcards FOR SELECT
  USING (
    auth.uid()::text = user_uuid
    OR
    (
      user_uuid IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
```

#### INSERT 策略
```sql
CREATE POLICY "Users can insert their own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_uuid
    OR user_uuid IS NULL
  );
```

#### UPDATE 策略
```sql
CREATE POLICY "Users can update their own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid()::text = user_uuid);
```
**注意**：只有登录用户可以更新闪卡

#### DELETE 策略
```sql
CREATE POLICY "Users can delete their own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid()::text = user_uuid);
```
**注意**：只有登录用户可以删除闪卡

**说明**：
- 匿名用户可以创建和查看闪卡（24 小时内）
- 只有登录用户可以更新和删除闪卡

---

## 🔑 关键概念

### auth.uid()

**含义**：当前登录用户的 UUID

**用法**：
```sql
auth.uid()::text = user_uuid
```

**说明**：
- `auth.uid()` 返回 UUID 类型
- `::text` 转换为文本类型
- 与表中的 `user_uuid` 字段比较

### USING vs WITH CHECK

**USING**：用于 SELECT、UPDATE、DELETE
- 决定哪些行可以被操作

**WITH CHECK**：用于 INSERT、UPDATE
- 决定哪些数据可以被插入或更新

**示例**：
```sql
-- SELECT/UPDATE/DELETE 使用 USING
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  USING (auth.uid()::text = user_uuid);

-- INSERT 使用 WITH CHECK
CREATE POLICY "policy_name"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid()::text = user_uuid);
```

### 匿名用户过期机制

**实现方式**：
```sql
user_uuid IS NULL
AND (expires_at IS NULL OR expires_at > NOW())
```

**说明**：
- `user_uuid IS NULL`：标识匿名用户
- `expires_at > NOW()`：检查是否过期
- 24 小时后，`expires_at < NOW()`，数据不可访问

---

## 📊 策略设计原则

### 1. 最小权限原则

只授予必要的权限，不多不少。

**示例**：
- `orders` 表：用户只能查看，不能修改
- `apikeys` 表：用户可以完全管理

### 2. 数据隔离原则

用户只能访问自己的数据。

**实现**：
```sql
auth.uid()::text = user_uuid
```

### 3. 匿名用户支持

对于需要支持匿名用户的功能，添加匿名访问策略。

**实现**：
```sql
user_uuid IS NULL
AND (expires_at IS NULL OR expires_at > NOW())
```

### 4. 系统管理保护

某些操作只能由系统执行，不开放给用户。

**示例**：
- 订单创建（Stripe webhook）
- 积分交易（系统管理）
- 用户注册（NextAuth.js）

---

## 🧪 测试策略

### 测试登录用户访问

```sql
-- 应该只返回当前用户的数据
SELECT * FROM flashcards;
```

### 测试匿名用户访问

```sql
-- 应该只返回未过期的匿名数据
SELECT * FROM flashcards WHERE user_uuid IS NULL;
```

### 测试跨用户访问（应该失败）

```sql
-- 尝试访问其他用户的数据（应该返回空）
SELECT * FROM flashcards WHERE user_uuid = '其他用户的UUID';
```

---

## 📚 相关文档

- `src/db/migrations/rls_all_tables.sql` - 完整的 RLS 配置脚本
- `SUPABASE_DATABASE_SETUP_GUIDE.md` - 数据库配置指南
- [Supabase RLS 官方文档](https://supabase.com/docs/guides/auth/row-level-security)

---

**文档版本**: 1.0  
**最后更新**: 2025-11-05  
**适用项目**: ai-turbolearn-template

