# 邮箱验证码验证流程深度分析与问题诊断

## 执行日期
2026-01-03

## 问题描述
用户反馈：收到验证码邮件，输入正确的验证码，但系统提示"验证码错误或者已过期"。数据库中能看到该验证码记录。

---

## 一、完整流程图

```mermaid
graph TB
    subgraph "前端 (AuthModal)"
        A[用户输入邮箱] --> B{检查用户是否存在}
        B -->|存在| C[Purpose = 'login']
        B -->|不存在| D[Purpose = 'register']
        C --> E[调用 /api/auth/send-code]
        D --> E
        E --> F[显示验证码输入界面]
        F --> G[用户输入6位验证码]
        G --> H[调用 signIn('email-code', ...)]
        H --> I{NextAuth Credentials Provider}
    end

    subgraph "发送验证码 API (/api/auth/send-code)"
        E --> S1[验证邮箱格式]
        S1 --> S2[检查用户存在性]
        S2 --> S3[生成6位数字验证码]
        S3 --> S4[存储到数据库]
        S4 --> S5[发送邮件 via Resend]
        S5 --> S6[返回成功]
    end

    subgraph "验证库 (verification.ts)"
        S4 --> V1[storeVerificationCode()]
        V1 --> V2[设置 expires_at = NOW + 15分钟]
        V2 --> V3[Insert into wmc_email_verification_codes]

        I --> V10[verifyCode()]
        V10 --> V11[Query: email + code + order by created_at DESC]
        V11 --> V12{检查记录}
        V12 -->|未找到| V13[返回 invalid_code]
        V12 -->|找到| V14{检查 used 字段}
        V14 -->|已使用| V15[返回 used]
        V14 -->|未使用| V16{检查是否过期}
        V16 -->|过期| V17[返回 expired]
        V16 -->|未过期| V18{检查尝试次数}
        V18 -->|超最大次数| V19[返回 max_attempts]
        V18 -->|正常| V20[返回 valid]
    end

    subgraph "NextAuth Credentials Provider"
        I --> C1[authorize() 回调]
        C1 --> C2[调用 verifyCode()]
        C2 --> C3{验证结果}
        C3 -->|失败| C4[抛出错误]
        C3 -->|成功| C5[查询用户]
        C5 --> C6{用户存在?}
        C6 -->|不存在 + register| C7[创建新用户]
        C6 -->|存在 + login| C8[使用现有用户]
        C7 --> C9[标记验证码为已使用]
        C8 --> C9
        C9 --> C10[返回用户信息]
    end

    subgraph "数据库表: wmc_email_verification_codes"
        V3 --> DB[(wmc_email_verification_codes)]
        DB --> DB1[id: UUID]
        DB --> DB2[email: TEXT]
        DB --> DB3[code: TEXT]
        DB --> DB4[purpose: TEXT]
        DB --> DB5[attempts: INTEGER]
        DB --> DB6[used: BOOLEAN]
        DB --> DB7[expires_at: TIMESTAMPTZ]
        DB --> DB8[created_at: TIMESTAMPTZ]
    end

    style V13 fill:#f9f,stroke:#333,stroke-width:2px
    style V14 fill:#f9f,stroke:#333,stroke-width:2px
    style V16 fill:#f9f,stroke:#333,stroke-width:2px
    style V18 fill:#f9f,stroke:#333,stroke-width:2px
```

---

## 二、关键代码路径追踪

### 2.1 发送验证码流程

**文件**: `src/app/api/auth/send-code/route.ts` (第 145-163 行)

```typescript
// 1. 生成验证码 (第 146 行)
const code = generateVerificationCode();  // 6位数字

// 2. 存储到数据库 (第 151-156 行)
await storeVerificationCode({
  email,
  code,
  purpose,
  // expiresInMinutes: 5 // 注释掉了，使用默认值 15 分钟
});

// 3. 发送邮件 (第 166-171 行)
await sendVerificationEmail({
  toEmail: email,
  verificationCode: code,
  purpose,
  locale
});
```

**问题点分析**:
- ✅ 验证码生成：使用 `randomInt(100000, 1000000)`，正确生成6位数字
- ✅ 存储：调用 `storeVerificationCode()`
- ✅ 邮件发送：使用 Resend API
- ⚠️ **过期时间**：注释显示预期5分钟，但实际使用15分钟（默认值），可能有混淆

---

### 2.2 存储验证码逻辑

**文件**: `src/lib/auth/verification.ts` (第 61-95 行)

```typescript
export async function storeVerificationCode(params) {
  const { email, code, purpose, expiresInMinutes = VERIFICATION_CODE_EXPIRY_MINUTES } = params;

  // VERIFICATION_CODE_EXPIRY_MINUTES = 15 (第 12 行)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + actualExpiresInMinutes);

  const { error, data } = await supabase
    .from('wmc_email_verification_codes')
    .insert({
      email,
      code,
      purpose,
      expires_at: expiresAt.toISOString(),  // ISO 格式字符串
    } as any);
}
```

**问题点分析**:
- ✅ 过期时间计算：NOW + 15 分钟
- ✅ 使用 `toISOString()`，标准 ISO 8601 格式
- ⚠️ **缺少 created_at**：没有显式设置 created_at，依赖数据库默认值
- ✅ 数据库应该有 `DEFAULT NOW()` 或触发器设置 created_at

---

### 2.3 验证验证码逻辑

**文件**: `src/lib/auth/verification.ts` (第 122-206 行)

```typescript
export async function verifyCode(email, code, purpose) {
  // 1. 查询验证码 (第 132-138 行)
  const { data: records, error } = await supabase
    .from('wmc_email_verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)  // ⚠️ 精确匹配
    .order('created_at', { ascending: false })
    .limit(1);

  const record = records && records.length > 0 ? records[0] : null;

  if (!record) {
    return { valid: false, reason: 'invalid_code' };  // 未找到
  }

  // 2. 检查是否已使用 (第 156-162 行)
  if (record.used) {
    return { valid: false, reason: 'used' };
  }

  // 3. 检查是否过期 (第 164-179 行)
  const now = new Date();
  const expiresAt = new Date(record.expires_at);

  if (expiresAt < now) {
    return { valid: false, reason: 'expired' };
  }

  // 4. 检查尝试次数 (第 191-198 行)
  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {  // MAX = 3
    return { valid: false, reason: 'max_attempts' };
  }

  return { valid: true, record };
}
```

**关键问题点** (高亮):

1. **查询条件严格匹配** (第 136 行):
   ```typescript
   .eq('code', code)  // 精确匹配，包含任何空白字符
   ```
   ⚠️ **潜在问题**：如果验证码包含空格或不可见字符，会导致匹配失败

2. **过期检查** (第 168 行):
   ```typescript
   if (expiresAt < now)  // 严格比较
   ```
   ⚠️ **潜在问题**：时区问题可能导致误判

3. **Purpose 不匹配仅警告** (第 182-189 行):
   ```typescript
   if (record.purpose !== purpose) {
     console.warn('Purpose mismatch');  // 只警告，不阻止验证
   }
   ```
   ✅ 正确：purpose 不影响验证结果（仅警告）

4. **时间戳比较**:
   - `expires_at` 存储为 ISO 字符串（例如：`2026-01-03T10:30:00.000Z`）
   - `new Date()` 使用本地时区
   - ⚠️ **潜在问题**：时区转换可能导致几秒到几小时的差异

---

### 2.4 NextAuth Credentials Provider 验证

**文件**: `src/lib/auth.config.ts` (第 101-224 行)

```typescript
Credentials({
  id: 'email-code',
  async authorize(credentials) {
    // 1. 验证输入
    if (!credentials?.email || !credentials?.code || !credentials?.purpose) {
      return null;
    }

    // 2. 验证验证码
    const result: VerifyCodeResult = await verifyCode(
      credentials.email,
      credentials.code,
      credentials.purpose
    );

    if (!result.valid) {
      console.log('Invalid verification code:', result.reason);
      throw new Error(result.reason || 'Verification failed');  // ⚠️ 抛出错误
    }

    // 3. 查找或创建用户
    const { data: user } = await supabase
      .from('wmc_users')
      .select('*')
      .eq('email', credentials.email)
      .single();

    if (!user) {
      if (credentials.purpose === 'register') {
        // 创建新用户
        const { error } = await supabase.from('wmc_users').insert({
          id: userId,
          email: credentials.email,
          name: usernameBase,
          tier: 'verified',
        });
      }
    }

    // 4. 标记验证码为已使用
    if (result.record?.id) {
      await markCodeAsUsed(result.record.id);
    }

    return user;  // 返回用户信息
  }
})
```

**关键问题点**:

1. **抛出错误** (第 131 行):
   ```typescript
   throw new Error(result.reason || 'Verification failed');
   ```
   当验证码无效时，抛出错误，NextAuth 会捕获并返回给前端

2. **双重验证路径**:
   - 前端先调用 `/api/auth/verify-code` (但实际代码中不是，看下面)
   - 然后调用 `signIn('email-code', ...)`
   - ⚠️ **问题**：`signIn` 会再次调用 `verifyCode()`，可能导致验证码被标记为已使用

---

### 2.5 前端调用流程

**文件**: `src/components/auth/auth-modal.tsx` (第 103-164 行)

```typescript
const handleVerifyCode = async (code: string) => {
  const purpose = userExists ? 'login' : 'register';

  // 直接使用 NextAuth 登录（authorize 回调会验证验证码）
  const result = await signIn('email-code', {
    email,
    code,
    purpose,
    redirect: false,    // 不自动重定向
  });

  if (result?.ok) {
    // 成功
    onClose();
    toast.success(...);
    router.push(`/${locale}/convert`);
  } else {
    // 失败
    let errorMessage = '验证失败，请重试';

    if (result?.error?.includes('expired')) {
      errorMessage = '验证码已过期';
    } else if (result?.error?.includes('invalid_code')) {
      errorMessage = '验证码错误';
    }

    setError(errorMessage);
  }
};
```

**关键发现**:

❗ **重要问题**：前端**没有**调用 `/api/auth/verify-code` API！

- 前端直接调用 `signIn('email-code', ...)`
- NextAuth 的 Credentials Provider 会调用 `authorize()` 回调
- `authorize()` 回调中使用 `verifyCode()` 验证
- ⚠️ **这意味着验证码验证只发生一次，在 NextAuth 层面**

这说明：`/api/auth/verify-code` 这个 API 实际上没有被使用！

---

## 三、可能的问题根源

### 3.1 高优先级问题（最可能）

#### 1. **验证码包含不可见字符**

在存储或传输过程中，验证码可能包含：
- 前后空格
- BOM 字符
- 换行符

**验证方法**:
```bash
# 运行调试脚本
npm run tsx scripts/debug-full-verification-flow.ts

# 检查输出中的验证码格式
# 查看是否显示 "Code 长度: 6" 但包含空格
```

**修复方案**:
```typescript
// src/lib/auth/verification.ts
export async function verifyCode(email, code, purpose) {
  // 清理验证码
  const cleanCode = code.trim();

  const { data: records, error } = await supabase
    .from('wmc_email_verification_codes')
    .select('*')
    .eq('email', email.trim())  // 清理邮箱
    .eq('code', cleanCode)       // 使用清理后的验证码
    .order('created_at', { ascending: false })
    .limit(1);
}
```

#### 2. **时间戳时区问题**

**问题描述**:
- `expires_at` 存储为 ISO 字符串（UTC）
- 比较时使用 `new Date()`（本地时区）
- 如果服务器或数据库时区配置不当，可能导致：
  - 验证码立过期（如果服务器时间超前）
  - 验证码显示过期但实际有效

**验证方法**:
- 运行调试脚本，检查时间戳
- 查看数据库中的 `expires_at` 值
- 比较服务器时间和本地时间

**修复方案**: 确保使用 UTC 时间
```typescript
// 使用 UTC 时间比较
const now = new Date();
const expiresAt = new Date(record.expires_at);

// 转换为毫秒时间戳比较（避免时区问题）
if (expiresAt.getTime() < now.getTime()) {
  return { valid: false, reason: 'expired' };
}
```

#### 3. **数据库查询返回旧记录**

**问题描述**:
查询使用 `order('created_at', { ascending: false })`，如果 `created_at` 为 NULL 或相同，可能返回错误记录。

**验证方法**:
```typescript
// 检查是否有 created_at 为 NULL 的记录
const { data: nullRecords } = await supabase
  .from('wmc_email_verification_codes')
  .select('*')
  .is('created_at', null);

console.log('Records with NULL created_at:', nullRecords?.length);
```

**修复方案**:
```typescript
// 在查询时增加额外条件
const { data: records, error } = await supabase
  .from('wmc_email_verification_codes')
  .select('*')
  .eq('email', email)
  .eq('code', code)
  .eq('used', false)                    // 只查未使用的
  .gt('expires_at', new Date().toISOString())  // 只查未过期的
  .order('created_at', { ascending: false })
  .limit(1);
```

---

### 3.2 中优先级问题

#### 4. **Purpose 不匹配**

**场景**:
1. 用户第一次打开弹窗，输入邮箱（不存在）→ Purpose = 'register'
2. 发送验证码（存储为 'register'）
3. 用户在另一个标签页登录，用户变为存在状态
4. 前端验证时使用 Purpose = 'login'
5. Purpose 不匹配导致验证码无效

**注意**: 代码中 purpose 不匹配只警告不阻止验证，所以通常不是这个问题。

**验证**: 查看日志中的警告信息

#### 5. **验证码重复问题**

**问题描述**:
- 如果两个用户同时发送验证码，可能产生相同验证码
- 虽然概率低（1/900,000），但可能发生
- 查询时返回最新的一条，可能不是当前用户的

**修复方案**: 使用唯一索引或添加更多查询条件

---

### 3.3 低优先级问题

#### 6. **并发问题**

**问题描述**:
- 多实例部署时，验证码存储和验证可能在不同实例
- Redis 缓存未同步
- 数据库主从延迟

**验证**: 检查是否多实例部署，是否有读从库写主库

#### 7. **尝试次数超限**

**问题描述**:
- 验证码只能尝试 3 次
- 第 4 次会返回 `max_attempts` 错误
- 用户可能不记得之前尝试过

**验证**: 检查数据库中的 `attempts` 字段

---

## 四、推荐的调试步骤

### 步骤 1: 运行完整调试脚本

```bash
npm run tsx scripts/debug-full-verification-flow.ts
```

这个脚本会测试：
- 验证码生成和存储
- 立即验证（模拟用户快速输入）
- 数据库查询和数据完整性
- 时间戳和时区问题
- 不同 purpose 的影响
- 输入格式敏感度

**预期输出**: 所有测试都应通过（valid = true）

**如果失败**: 查看具体哪一步失败，对应问题根源

### 步骤 2: 实时捕获问题

修改验证代码，增加详细日志：

```typescript
// src/lib/auth/verification.ts
export async function verifyCode(email, code, purpose) {
  console.log(`[VerifyCode] Input - Email: "${email}", Code: "${code}", Purpose: ${purpose}`);
  console.log(`[VerifyCode] Code length: ${code.length}, Trimmed length: ${code.trim().length}`);

  const { data: records, error } = await supabase
    .from('wmc_email_verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log(`[VerifyCode] Query returned ${records?.length || 0} records`);

  if (records && records.length > 0) {
    const record = records[0];
    console.log(`[VerifyCode] Found record:`, {
      id: record.id,
      dbCode: `"${record.code}"`,
      dbCodeLength: record.code.length,
      purpose: record.purpose,
      used: record.used,
      attempts: record.attempts,
      expires_at: record.expires_at,
      created_at: record.created_at
    });
  }

  // ... 剩余验证逻辑
}
```

然后在实际环境中测试，查看日志输出。

### 步骤 3: 检查数据库数据

```bash
npm run tsx scripts/check-verification-codes.ts
```

查看：
- created_at 是否为 NULL
- expires_at 是否合理（15分钟后）
- 是否有重复记录
- code 字段是否包含空格

### 步骤 4: 手动验证

如果数据库中有失败的验证码记录，手动验证：

```typescript
// 使用实际失败的数据
const failedEmail = 'test@example.com';
const failedCode = '123456';  // 实际失败的验证码

const result = await verifyCode(failedEmail, failedCode, 'login');
console.log('Verification result:', result);
```

---

## 五、快速修复方案

### 方案 1: 清理输入（推荐）

```typescript
// src/lib/auth/verification.ts
export async function verifyCode(
  email: string,
  code: string,
  purpose: 'register' | 'login' | 'update_email'
): Promise<VerifyCodeResult> {
  // 清理输入
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  console.log(`[VerifyCode] Cleaned - Email: "${cleanEmail}", Code: "${cleanCode}"`);

  const { data: records, error } = await supabase
    .from('wmc_email_verification_codes')
    .select('*')
    .eq('email', cleanEmail)
    .eq('code', cleanCode)  // 使用清理后的验证码
    .order('created_at', { ascending: false })
    .limit(1);

  // ... 剩余逻辑
}

// 同时修改存储时也清理
export async function storeVerificationCode(params: StoreVerificationCodeParams) {
  const { email, code, purpose, expiresInMinutes = VERIFICATION_CODE_EXPIRY_MINUTES } = params;

  const supabase = createAdminClient();
  const actualExpiresInMinutes = expiresInMinutes || VERIFICATION_CODE_EXPIRY_MINUTES;

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + actualExpiresInMinutes);

  // 清理输入
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  const { error, data } = await supabase
    .from('wmc_email_verification_codes')
    .insert({
      email: cleanEmail,
      code: cleanCode,  // 存储清理后的验证码
      purpose,
      expires_at: expiresAt.toISOString(),
    } as any);

  // ...
}
```

### 方案 2: 增加详细的错误日志

```typescript
// src/lib/auth/verification.ts
export async function verifyCode(email, code, purpose) {
  console.log(`[VerifyCode] === START ===`);
  console.log(`[VerifyCode] Email: "${email}" (len: ${email.length})`);
  console.log(`[VerifyCode] Code: "${code}" (len: ${code.length})`);
  console.log(`[VerifyCode] Code chars:`, code.split('').map((c, i) => `${i}:'${c}'`).join(', '));
  console.log(`[VerifyCode] Purpose: ${purpose}`);
  console.log(`[VerifyCode] Current time: ${new Date().toISOString()}`);

  const { data: records, error } = await supabase
    .from('wmc_email_verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[VerifyCode] DB Error:', error);
    return { valid: false, reason: 'invalid_code' };
  }

  console.log(`[VerifyCode] Found ${records?.length || 0} records`);

  if (!records || records.length === 0) {
    console.log('[VerifyCode] No matching record found');

    // 调试：查找相同邮箱的所有验证码
    const { data: allCodes } = await supabase
      .from('wmc_email_verification_codes')
      .select('id, code, created_at, expires_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`[VerifyCode] All codes for ${email}:`, allCodes);

    return { valid: false, reason: 'invalid_code' };
  }

  const record = records[0];
  console.log('[VerifyCode] Record found:', {
    id: record.id,
    storedCode: `"${record.code}"`,
    storedCodeLength: record.code.length,
    purpose: record.purpose,
    used: record.used,
    attempts: record.attempts,
    created_at: record.created_at,
    expires_at: record.expires_at,
  });

  // 检查是否已使用
  if (record.used) {
    console.log('[VerifyCode] Code already used');
    return { valid: false, reason: 'used' };
  }

  // 检查是否过期（详细日志）
  const now = new Date();
  const expiresAt = new Date(record.expires_at);

  console.log('[VerifyCode] Time check:', {
    now: now.toISOString(),
    now_ms: now.getTime(),
    expiresAt: expiresAt.toISOString(),
    expiresAt_ms: expiresAt.getTime(),
    diff_ms: now.getTime() - expiresAt.getTime(),
    isExpired: expiresAt < now,
  });

  if (expiresAt < now) {
    console.log('[VerifyCode] Code expired');
    return { valid: false, reason: 'expired' };
  }

  // 检查尝试次数
  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    console.log('[VerifyCode] Max attempts reached');
    return { valid: false, reason: 'max_attempts' };
  }

  console.log('[VerifyCode] Code is valid');
  console.log('[VerifyCode] === END ===');

  return { valid: true, record };
}
```

### 方案 3: 严格的时间管理

```typescript
// src/lib/auth/verification.ts

// 统一使用 UTC 时间
function getCurrentTime() {
  return new Date();  // JavaScript Date 自动处理时区
}

export async function storeVerificationCode(params) {
  const { email, code, purpose, expiresInMinutes = VERIFICATION_CODE_EXPIRY_MINUTES } = params;

  const supabase = createAdminClient();
  const actualExpiresInMinutes = expiresInMinutes || VERIFICATION_CODE_EXPIRY_MINUTES;

  // 使用当前时间
  const now = getCurrentTime();
  const expiresAt = new Date(now);
  expiresAt.setMinutes(expiresAt.getMinutes() + actualExpiresInMinutes);

  console.log(`[StoreCode] Current time: ${now.toISOString()}`);
  console.log(`[StoreCode] Expires at: ${expiresAt.toISOString()}`);

  const { error, data } = await supabase
    .from('wmc_email_verification_codes')
    .insert({
      email,
      code,
      purpose,
      expires_at: expiresAt.toISOString(),
    } as any);

  // ...
}

export async function verifyCode(email, code, purpose) {
  // ... 查询逻辑 ...

  // 检查是否过期（使用毫秒比较）
  const now = getCurrentTime();
  const expiresAt = new Date(record.expires_at);

  // 增加 1 分钟宽限期（避免时钟偏差）
  const gracePeriod = 60 * 1000;  // 1 分钟

  if (expiresAt.getTime() < (now.getTime() - gracePeriod)) {
    return { valid: false, reason: 'expired' };
  }

  // ...
}
```

---

## 六、数据库 Schema 检查

### 检查表结构

```sql
-- 连接到 Supabase 数据库
-- 或者使用 Supabase Studio

-- 检查表结构
\d wmc_email_verification_codes;

-- 预期输出:
--  Column   |            Type             | Collation | Nullable | Default
-- ----------+-----------------------------+-----------+----------+--------
--  id       | uuid                        |           | not null | gen_random_uuid()
--  email    | text                        |           | not null |
--  code     | text                        |           | not null |
--  purpose  | text                        |           | not null |
--  attempts | integer                     |           |          | 0
--  used     | boolean                     |           |          | false
--  expires_at | timestamp with time zone   |           | not null |
--  created_at | timestamp with time zone   |           |          | now()
```

### 检查索引

```sql
-- 检查索引
\di wmc_email_verification_codes_*;

-- 推荐创建的索引:
CREATE INDEX idx_email_code ON wmc_email_verification_codes(email, code);
CREATE INDEX idx_created_at ON wmc_email_verification_codes(created_at);
CREATE INDEX idx_expires_at ON wmc_email_verification_codes(expires_at);
CREATE INDEX idx_used ON wmc_email_verification_codes(used) WHERE used = false;
```

### 检查数据示例

```sql
-- 查询最新的几条记录
SELECT
  id,
  email,
  code,
  purpose,
  attempts,
  used,
  expires_at,
  created_at,
  NOW() as current_time
FROM wmc_email_verification_codes
ORDER BY created_at DESC
LIMIT 5;

-- 检查是否有异常数据
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN created_at IS NULL THEN 1 END) as null_created_at,
  COUNT(CASE WHEN expires_at < created_at THEN 1 END) as invalid_expiry,
  COUNT(CASE WHEN attempts > 3 THEN 1 END) as over_attempts
FROM wmc_email_verification_codes
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 七、测试检查清单

### 7.1 基础功能测试

- [ ] 发送验证码成功
- [ ] 收到邮件且验证码为6位数字
- [ ] 数据库中能看到记录
- [ ] created_at 字段有值
- [ ] expires_at 是15分钟后
- [ ] 输入正确验证码能通过验证
- [ ] 验证后 used 字段变为 true
- [ ] 尝试次数被正确记录

### 7.2 边界情况测试

- [ ] 验证码超过15分钟过期
- [ ] 尝试3次失败后第四次被拒绝
- [ ] 已使用的验证码不能再次使用
- [ ] 错误的验证码提示错误
- [ ] 不存在的邮箱提示错误
- [ ] 输入验证码包含空格能自动清理

### 7.3 性能测试

- [ ] 同一邮箱多次发送验证码
- [ ] 并发请求下的验证码验证
- [ ] 数据库查询速度（有索引）

---

## 八、最终建议

### 立即行动（按优先级）

1. **运行调试脚本** (`scripts/debug-full-verification-flow.ts`)
   - 确认基础流程是否正常
   - 检查时间戳和时区

2. **添加详细日志**到 `verifyCode()` 函数
   - 捕获实际失败的详细信息
   - 定位具体问题点

3. **清理输入数据**
   - 在存储和验证时清理邮箱和验证码
   - 去除前后空格

4. **检查数据库 Schema**
   - 确认 created_at 有默认值
   - 添加必要的索引

5. **删除未使用的 API**
   - `/api/auth/verify-code` 没有被使用
   - 考虑删除或重构前端逻辑

### 中期优化

1. **增加宽限期**（避免时钟偏差）
   - 验证码过期时间增加 1-2 分钟宽限期

2. **优化错误提示**
   - 区分"验证码错误"和"验证码过期"
   - 显示剩余尝试次数

3. **添加测试覆盖**
   - 单元测试验证逻辑
   - 集成测试完整流程

4. **考虑使用 Redis 缓存**
   - 减少数据库查询
   - 提高性能

### 长期改进

1. **审计日志**
   - 记录所有验证尝试
   - 用于安全分析

2. **验证码复杂度**
   - 考虑字母数字混合
   - 增加安全性

3. **替代验证方式**
   - 短信验证码
   - TOTP 验证器

---

## 九、附录：相关脚本

### debug-full-verification-flow.ts

完整调试脚本，测试整个流程。

```bash
npm install tsx ts-node @types/node --save-dev
npm run tsx scripts/debug-full-verification-flow.ts
```

### check-verification-codes.ts

检查数据库中最近的验证码。

```bash
npm run tsx scripts/check-verification-codes.ts
```

### debug-verification-insert.ts

测试插入和查询逻辑。

```bash
npm run tsx scripts/debug-verification-insert.ts
```

---

## 十、总结

验证码验证失败的可能原因（按可能性排序）：

1. **验证码包含不可见字符**（最高概率）
   - 存储或传输过程中的空格
   - 前后端对码值处理不一致

2. **时间戳时区问题**
   - UTC 和本地时间转换错误
   - 服务器时间不准确

3. **数据库查询问题**
   - created_at 为 NULL
   - 缺少索引导致查询慢

4. **Purpose 不匹配**
   - 发送和验证时的 purpose 不一致
   - 虽然代码中只警告，但仍需确认

5. **尝试次数超限**
   - 用户尝试超过 3 次
   - 需要重新发送验证码

**下一步行动**：
1. 运行 `debug-full-verification-flow.ts` 脚本
2. 根据脚本输出定位具体问题
3. 应用对应的修复方案

---

**分析完成时间**: 2026-01-03
**分析者**: Claude Code AI
**文档版本**: 1.0
