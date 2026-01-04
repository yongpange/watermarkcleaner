# Admin Client 安全风险分析报告

## 评估时间
2026-01-03

## 风险概述
**风险等级**: 🔴 高风险（如果误用）
**当前状态**: 🟢 安全（正确使用）
**潜在影响**: 数据库完全泄露或被控制

---

## 问题发现

`src/lib/credits/check.ts` 使用了 `createAdminClient()`，这个函数使用 SUPABASE_SERVICE_ROLE_KEY，可以直接访问和修改数据库（绕过所有 RLS 策略）。

```typescript
// src/lib/credits/check.ts
import { createAdminClient } from '@/lib/supabase-admin';

export async function deductCredits(userId: string) {
  // 使用 Admin Client 绕过 RLS
  const supabase = createAdminClient(); // ⚠️ THIS LINE

  const { data: user } = await supabase
    .from('wmc_users')
    .select('creditsused')
    .eq('id', userId)
    .single();

  await supabase
    .from('wmc_users')
    .update({ creditsused: user.creditsused + 1 })
    .eq('id', userId); // 绕过 RLS
}
```

---

## 安全分析

### 1. 谁在使用 deductCredits？

```bash
# 搜索调用者

$ grep -r "deductCredits" src/ --include="*.ts" --include="*.tsx"

结果：
- src/app/api/seededit/route.ts (第 322 行) ✅
- src/lib/credits/check.ts (函数定义) ✅
```

**只在以下文件中使用：**
1. `src/app/api/seededit/route.ts` - API 路由（服务端）
2. `src/lib/credits/check.ts` - 函数定义

### 2. API 路由导入分析

```typescript
// src/app/api/seededit/route.ts
import { checkUserCredits, deductCredits, ... } from "@/lib/credits/check";

// API Route Handler
export async function POST(req: NextRequest) {
  // 服务端执行
  await deductCredits(userId);
}
```

**关键点**：
- ✅ API 路由只在服务端运行
- ✅ 永远不会被打包到客户端 bundle 中
- ✅ Service Role Key 不会泄露到浏览器

### 3. 客户端导入检查

```bash
# 检查客户端组件是否导入 credits/check

$ grep -r "from.*credits/check" src/components --include="*.tsx"
结果: (无) ✅

$ grep -r "from.*credits/check" src/app --include="*.tsx" --exclude-dir=api
结果: (无) ✅
```

**结论**：目前没有客户端代码导入包含 Admin Client 的模块。

### 4. 当前导入链

```
src/app/api/seededit/route.ts (API Route)
  └─> imports: deductCredits from credits/check
      └─> imports: createAdminClient from supabase-admin
          └─> uses: SUPABASE_SERVICE_ROLE_KEY
```

**关键点**：
- 导入链只在服务端启动
- 客户端代码无法访问 API Route 的内部实现
- 浏览器只能看到 HTTP 请求/响应

---

## ✅ 当前代码是安全的

### 为什么安全？

1. **API 路由天然隔离**
   ```typescript
   // API 路由只在服务端执行
   // 客户端代码只能调用 HTTP 接口，看不到内部实现
   POST /api/seededit
   ```

2. **Next.js 的 bundle 分离**
   ```
   服务端 bundle:
   - src/app/api/** (包含 Admin Key)
   - src/lib/server-only/**

   客户端 bundle:
   - src/components/**
   - src/app/**/page.tsx
   - src/app/**/client.tsx
   - **不包含服务端代码**
   ```

3. **正确的调用栈**
   ```
   浏览器
     -> HTTP POST /api/seededit
       -> API Route Handler (服务端)
         -> deductCredits() (服务端)
           -> createAdminClient() (服务端) ✅
   ```

---

## ⚠️ 潜在风险

### 风险场景 1: 误导入到客户端

```typescript
// ❌ 危险的客户端代码
"use client";

import { deductCredits } from "@/lib/credits/check"; // ❌ 导入了 Admin Client

export function ImageProcessor() {
  const handleProcess = async () => {
    // 在浏览器中执行
    await deductCredits(userId); // ⚠️ Service Role Key 泄露到 bundle
  };

  return <button onClick={handleProcess}>处理图片</button>;
}
```

**后果**：
- Service Role Key 被打包到前端 bundle
- 任何人都可以解压 bundle 并找到密钥
- 完全控制数据库（读取、修改、删除所有数据）

### 风险场景 2: 间接导入

```typescript
// 文件: src/lib/utils.ts
export * from "./credits/check"; // ❌ 不小心导出了 Admin 函数

// 文件: src/components/image-uploader.tsx
"use client";

import { deductCredits } from "@/lib/utils"; // ❌ 间接引入了 Admin Client
```

### 风险场景 3: 动态导入

```typescript
// ❌ 动态导入也会泄露
const { deductCredits } = await import("@/lib/credits/check");
```

---

## 🔒 安全加固建议

### 方案 1: 创建 'server-only' 标记（推荐）

**步骤 1**: 安装 server-only 包
```bash
npm install server-only
```

**步骤 2**: 创建服务端专用函数文件
```typescript
// src/lib/server-actions/credits.ts
import "server-only"; // ❌ 禁止在客户端导入

import { createAdminClient } from "@/lib/supabase-admin";

export async function deductCredits(userId: string) {
  // 安全：如果误导入到客户端，构建时会报错
  const supabase = createAdminClient();
  // ...
}
```

**步骤 3**: 只有服务端文件才能使用
```typescript
// 错误示例（构建时报错）
❌ /src/components/client-component.tsx
Module not found: Error: server-only module cannot be imported in client components
```

### 方案 2: 添加运行时检查

```typescript
// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  // 运行时检查
  if (typeof window !== 'undefined') {
    console.error('🚨 SECURITY WARNING: createAdminClient called in browser!');
    throw new Error('Admin client can only be used on the server');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
}
```

### 方案 3: 代码隔离

```
src/
├── lib/
│   ├── client/    # 客户端专用
│   │   └── utils.ts
│   └── server/    # 服务端专用
│       └── credits/
│           └── admin-actions.ts  # 包含 createAdminClient
├── components/
│   └── client/    # 仅限客户端
├── app/
│   └── api/       # 服务端 API
└── README.md      # 明确说明哪些代码可以在哪里使用
```

### 方案 4: Lint 规则

安装 ESLint 规则防止误导入：

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [{
          "group": ["**/lib/server/**"],
          "message": "Server code cannot be imported in client components"
        }]
      }
    ]
  }
}
```

---

## 🛡️ 立即改进

### 1. 添加 server-only 检查

```bash
# 安装
npm install server-only
```

### 2. 标记敏感函数

```typescript
// 在每个使用 Admin Client 的文件顶部
import "server-only";

// 或添加 JSDoc 注释
/**
 * @server-only Do NOT import in client components
 */
export function deductCredits(userId: string) {
  // ...
}
```

### 3. 使用 TypeScript 类型保护

```typescript
// src/lib/supabase-admin.ts
export function createAdminClient(): {
  // 返回类型标注为 "仅服务端"
  // TypeScript 会警告如果尝试在浏览器类型中使用
} {
  // ...
}
```

### 4. Git 预提交检查

```bash
# .git/hooks/pre-commit

# 检查是否导入了 credits/check 到客户端文件
if grep -r "from.*credits/check" src/components/ --include="*.tsx" | grep -v "//"; then
  echo "❌ 检测到客户端代码导入了 credits/check"
  echo "    这会导致 Service Role Key 泄露！"
  exit 1
fi
```

---

## 📊 当前代码安全评分

| 检查项 | 状态 | 风险 |
|--------|--------|--------|
| API 路由导入 | ✅ 只在服务端 | 无 |
| 客户端导入 | ✅ 无导入 | 无 |
| 导入链清晰 | ✅ 清晰 | 无 |
| 有被误导入风险 | ⚠️ 有可能 | 中 |
| 运行时检查 | ❌ 无 | 中 |
| 构建时检查 | ❌ 无 | 高 |

**总体评分: 7/10** (良好，但有改进空间)

---

## 🎯 推荐行动计划

### Phase 1: 立即（今天）

- [ ] 安装 `server-only` 包
- [ ] 在 `src/lib/credits/check.ts` 顶部添加 `import "server-only"`
- [ ] 测试构建，确保不会报错

### Phase 2: 本周

- [ ] 创建 `src/lib/server/` 目录，移动所有服务端专用代码
- [ ] 更新所有导入路径
- [ ] 添加 ESLint 规则

### Phase 3: 持续改进

- [ ] 在 `createAdminClient()` 中添加运行时检查
- [ ] 添加 Git 预提交钩子
- [ ] 编写安全文档
- [ ] 团队培训

---

## 🔍 如何自查

### 检查当前 bundle 是否泄露密钥

```bash
# 构建生产版本
npm run build

# 检查生成的 bundle 是否包含密钥
grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/ --include="*.js" --include="*.map"

# 如果有输出，说明密钥泄露了！
# 正常情况下应该没有任何输出
```

### 检查哪些代码被打包到客户端

```bash
# 安装 bundle analyzer
npm install -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({});

# 运行分析
ANALYZE=true npm run build
```

查看客户端 bundle 是否包含 `src/lib/credits/check.ts`

---

## ✨ 最佳实践

### ✅ 安全模式

```
客户端代码 (浏览器)
  └─> HTTP API 请求
      └─> API Route (服务端)
          └─> Admin Client (安全)
```

### ❌ 危险模式

```
客户端代码 (浏览器)
  └─> import { deductCredits } (❌ 泄露密钥)
      └─> createAdminClient()
          └─> Service Role Key (泄露！)
```

---

## 📝 总结

**当前代码**: ✅ 安全（正确使用）
**潜在风险**: 高（如果被误导入到客户端）
**改进建议**: 立即添加 server-only 保护

**关键要点**:
- API 路由是安全的隔离边界
- 永远不要将 createAdminClient 或其封装函数导入到客户端
- 使用 server-only 包防止误导入
- 添加运行时检查作为额外的安全层

---

**评估者**: Claude Code AI
**评估时间**: 2026-01-03
**下次审查**: 建议在本周末前完成 Phase 1 改进
