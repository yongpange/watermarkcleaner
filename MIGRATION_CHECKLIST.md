# Google OAuth - 长期解决方案实施清单

## ✅ 状态：已完成代码修改

现在需要执行以下步骤来完成 SupabaseAdapter 的配置：

---

## 📋 执行步骤

### 第 1 步：检查并执行数据库迁移

**选项 A：使用 Supabase CLI（推荐）**

```bash
# 如果未安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 执行迁移
supabase db push
```

**选项 B：手动执行 SQL**

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入你的项目 → SQL Editor
3. 点击 "New query"
4. 复制粘贴 `supabase\migrations\20260119000000_nextauth_schema.sql` 内容
5. 点击 "Run"

**选项 C：使用 psql**

```bash
psql -h db.hatwvsjfedokodofiqsb.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase\migrations\20260119000000_nextauth_schema.sql
```

---

### 第 2 步：验证表结构

迁移执行后，检查以下表是否创建：

```sql
-- 验证 profiles schema 和表
SELECT tablename
FROM pg_tables
WHERE schemaname = 'profiles';

-- 期望返回：
-- users
-- accounts
-- sessions
-- verification_tokens
```

---

### 第 3 步：重启开发服务器

```bash
# 完全停止服务器
Ctrl + C

# 重新启动
npm run dev
```

---

### 第 4 步：测试 Google OAuth 登录

1. 访问 `http://localhost:3000/zh`
2. 点击 Google 登录按钮
3. **验证控制台输出**：

```
# ✅ 期望的日志：
[Auth Debug] NextAuth initialized successfully
[Auth] User signed in: your-email@gmail.com Provider: google
[Auth] ✅ New user created via Adapter: your-email@gmail.com ID: xxx
[Auth] ✅ Database trigger will sync to wmc_users table
[jwt] App user data loaded: { tier: 'verified', credits: 0 }
```

---

### 第 5 步：验证数据库数据

**检查 profiles.users**（NextAuth 管理的表）：

```sql
SELECT id, email, name, email_verified
FROM profiles.users
WHERE email = 'your-email@gmail.com';
```

**检查 profiles.accounts**（OAuth 账户信息）：

```sql
SELECT provider, provider_account_id, type
FROM profiles.accounts
WHERE user_id = (SELECT id FROM profiles.users WHERE email = 'your-email@gmail.com');

-- 期望结果：provider = 'google', type = 'oauth'
```

**检查 wmc_users**（应用程序用户表，通过触发器同步）：

```sql
SELECT id, email, name, tier, creditsused
FROM public.wmc_users
WHERE email = 'your-email@gmail.com';

-- 期望结果：
-- id = 与 profiles.users.id 相同（触发器同步）
-- tier = 'verified'（触发器自动设置）
-- creditsused = 0 (或之前的值)
```

---

## 🔍 验证检查清单

- [ ] **profiles.users 表中创建了用户记录**
- [ ] **profiles.accounts 表中记录了 Google OAuth 信息**
- [ ] **wmc_users 表通过触发器自动同步了数据**
- [ ] **用户 tier 自动设置为 'verified'**
- [ ] **登录后页面显示用户信息（头像、名称）**
- [ ] **控制台显示 "New user created via Adapter"**
- [ ] **没有 500 错误或 AdapterError**

---

## 🎯 工作原理说明

### 新的数据流：

```
用户点击 Google 登录
    ↓
NextAuth.js 处理 OAuth 流程
    ↓
SupabaseAdapter 自动创建用户：
  - profiles.users （用户基本信息）
  - profiles.accounts （Google OAuth 信息）
    ↓
数据库触发器自动同步：
  - 将数据复制到 public.wmc_users
  - 设置 tier = 'verified'
    ↓
application 可以使用 wmc_users 表
```

### 架构优势：

1. **分离职责**：
   - `profiles.*`：NextAuth.js 内部管理
   - `public.wmc_*`：应用程序使用

2. **自动同步**：
   - 触发器保证数据一致性
   - 无需手动同步逻辑

3. **可扩展性**：
   - 未来可以轻松添加更多 OAuth 提供商
   - 所有数据自动同步到应用表

---

## 📝 如果触发器不工作

如果 wmc_users 表没有自动同步数据，请手动执行同步函数：

```sql
-- 检查触发器是否存在
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'profiles'
  AND event_object_table = 'users';

-- 如果触发器不存在，手动创建
CREATE OR REPLACE FUNCTION sync_user_to_app_table()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wmc_users (id, email, name, image, tier, creditsused, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.name, NEW.image, 'verified', 0, NEW.created_at, NEW.updated_at)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    tier = 'verified',
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_after_insert
  AFTER INSERT ON profiles.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_to_app_table();
```

---

## 🚨 如果仍然遇到 AdapterError

**可能原因：**
1. 表结构不正确（列名或类型不匹配）
2. RLS (Row Level Security) 阻止了访问
3. 环境变量中的 service role key 无效

**排查步骤：**

```bash
# 检查环境变量
echo %SUPABASE_SERVICE_ROLE_KEY%

# 验证可以绕过 RLS 访问
npx supabase db reset  # 重置数据库并重新迁移
```

---

## ✅ 完成标准

当所有检查项目都完成且没有错误时，说明配置正确：

✅ SupabaseAdapter 正常工作
✅ 用户数据在两个 schema 中同步
✅ 不再需要手动处理用户创建
✅ OAuth 账户自动关联
✅ 代码简洁且符合 NextAuth 最佳实践

---

## 🎉 下一步

完成这些步骤后，你可以：

1. **添加更多 OAuth 提供商**（GitHub、Twitter）
2. **实现密码登录**（Credentials provider）
3. **添加邮箱验证**（Email provider）
4. **优化性能和索引**
5. **添加监控和日志**

---

**环境**: Windows
**NextAuth**: 5.0.0-beta.25
**Supabase**: PostgreSQL
**最后更新**: 2026-01-19
