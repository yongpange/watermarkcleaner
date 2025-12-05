# 🔧 文档转换持久化问题修复

**日期**: 2025-11-05  
**问题**: 转换结果只存储在内存中，刷新页面后丢失

---

## 🐛 问题描述

### 用户报告的错误

```
Failed to load resource: the server responded with a status of 404 (Not Found)
{"success":false,"error":"Conversion not found"}
Fetch error: Error: Failed to fetch conversion result
```

### 根本原因

**转换结果只存储在内存 Map 中，没有保存到数据库**：

```typescript
// src/app/api/convert/shared-store.ts
export const conversionTasks = new Map<string, ConversionResult>();
```

**问题**：
- ❌ 服务器重启后数据丢失
- ❌ 页面刷新后无法找到之前的转换
- ❌ 不支持持久化存储

---

## ✅ 解决方案

### 修改的文件

#### 1. `src/app/api/convert/process/route.ts`

**修改内容**：
- ✅ 添加 Supabase 导入
- ✅ 获取用户信息（支持匿名用户）
- ✅ 在转换开始时创建数据库记录
- ✅ 在转换过程中更新进度到数据库
- ✅ 在转换完成时保存结果到数据库

**关键代码**：

```typescript
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  // Get user info (optional, supports anonymous users)
  const session = await auth();
  const userUuid = session?.user?.uuid || null;

  const body = await request.json();
  const { fileId, fileName, fileSize, fileType, options } = body;

  // Calculate expiration time (24 hours for anonymous users)
  const expiresAt = userUuid 
    ? null 
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Create database record
  const { error: insertError } = await supabase
    .from('conversions')
    .insert({
      uuid: randomUUID(),
      user_uuid: userUuid,
      file_id: fileId,
      file_name: fileName || 'unknown',
      file_size: fileSize || 0,
      file_type: fileType || 'application/octet-stream',
      status: 'processing',
      progress: 0,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

  // Start async conversion
  performConversion(conversionId, fileId, userUuid, options);
}

async function performConversion(
  conversionId: string,
  fileId: string,
  userUuid: string | null,
  options: any
) {
  // Update progress to database
  await supabase
    .from('conversions')
    .update({ progress: 10 })
    .eq('file_id', fileId);

  // ... conversion logic ...

  // Save result to database
  const { error: updateError } = await supabase
    .from('conversions')
    .update({
      status: 'completed',
      progress: 100,
      result: result,
      completed_at: new Date().toISOString(),
    })
    .eq('file_id', fileId);

  console.log(`✅ Conversion saved to database: ${fileId}`);
}
```

---

#### 2. `src/app/api/convert/result/[id]/route.ts`

**修改内容**：
- ✅ 添加 Supabase 导入
- ✅ 优先从内存读取（快速）
- ✅ 如果内存中没有，从数据库读取（持久化）

**关键代码**：

```typescript
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }) {
  const { id } = await params;
  
  // First, try to get from memory (for recent conversions)
  const task = conversionTasks.get(id);

  if (task) {
    // Return from memory
    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        fileId: task.fileId,
        status: task.status,
        result: task.result,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      },
    });
  }

  // If not in memory, try to get from database (for persistent storage)
  const { data: dbConversion, error: dbError } = await supabase
    .from('conversions')
    .select('*')
    .eq('file_id', id)
    .single();

  if (dbError || !dbConversion) {
    return NextResponse.json(
      { success: false, error: 'Conversion not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: dbConversion.file_id,
      fileId: dbConversion.file_id,
      status: dbConversion.status,
      result: dbConversion.result,
      createdAt: dbConversion.created_at,
      completedAt: dbConversion.completed_at,
    },
  });
}
```

---

#### 3. `src/app/[locale]/convert/client.tsx`

**修改内容**：
- ✅ 在调用 `/api/convert/process` 时传递文件信息

**关键代码**：

```typescript
// Step 2: Start conversion
const processResponse = await fetch("/api/convert/process", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileId: uploadData.data.fileId,
    fileName: file.name,      // ✅ 新增
    fileSize: file.size,      // ✅ 新增
    fileType: file.type,      // ✅ 新增
    options: {
      targetFormat: "markdown",
      detectLanguage: true,
    },
  }),
});
```

---

## 🎯 修复效果

### 修复前 ❌

1. 转换结果只存储在内存 `Map` 中
2. 刷新页面后，`Map` 清空，数据丢失
3. 前端请求 `/api/convert/result/[id]` 返回 404
4. 用户看到 "Conversion not found" 错误

### 修复后 ✅

1. 转换开始时，创建数据库记录
2. 转换过程中，更新进度到数据库
3. 转换完成时，保存结果到数据库
4. 刷新页面后，从数据库读取数据
5. 支持匿名用户（24 小时过期）
6. 支持登录用户（永久保存）

---

## 📊 数据流程

### 完整的转换流程

```
1. 用户上传文件
   ↓
2. POST /api/convert/upload
   → 保存文件到本地文件系统
   → 返回 fileId
   ↓
3. POST /api/convert/process
   → 创建数据库记录 (conversions 表)
   → 开始异步转换
   → 返回 conversionId
   ↓
4. 轮询 GET /api/convert/status/[id]
   → 从内存或数据库读取状态
   → 返回进度 (0-100)
   ↓
5. GET /api/convert/result/[id]
   → 优先从内存读取
   → 如果内存中没有，从数据库读取
   → 返回转换结果
   ↓
6. 刷新页面
   → GET /api/convert/result/[id]
   → 从数据库读取（✅ 数据仍然存在）
```

---

## 🗄️ 数据库表结构

### conversions 表

```sql
CREATE TABLE "conversions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "uuid" varchar(255) NOT NULL UNIQUE,
  "user_uuid" varchar(255),                    -- 用户 ID（可为空，支持匿名）
  "file_id" varchar(255) NOT NULL,             -- 文件唯一标识
  "file_name" varchar(500) NOT NULL,           -- 文件名
  "file_size" bigint NOT NULL,                 -- 文件大小（字节）
  "file_type" varchar(100) NOT NULL,           -- MIME 类型
  "file_url" text,                             -- S3 存储 URL
  "status" varchar(50) DEFAULT 'pending' NOT NULL,  -- 转换状态
  "progress" integer DEFAULT 0 NOT NULL,       -- 进度 0-100
  "result" jsonb,                              -- ✅ 转换结果（JSON）
  "error" jsonb,                               -- 错误信息（JSON）
  "created_at" timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone,
  "expires_at" timestamp with time zone        -- 过期时间（匿名用户）
);
```

### result 字段结构

```typescript
{
  content: string,           // Markdown 内容
  metadata: {
    wordCount: number,       // 字数
    language: string,        // 语言
    pageCount: number,       // 页数
    sections: string[],      // 章节
  },
  aiSummary?: string,        // AI 学习笔记（可选）
}
```

---

## 🧪 测试验证

### 测试步骤

1. **上传并转换文件**：
   ```
   访问: http://localhost:3000/en/convert
   上传一个 PDF 文件
   等待转换完成
   ```

2. **刷新页面**：
   ```
   按 F5 刷新页面
   ✅ 应该能看到之前的转换结果
   ```

3. **检查数据库**：
   ```sql
   SELECT * FROM conversions ORDER BY created_at DESC LIMIT 5;
   ```
   ✅ 应该能看到转换记录

4. **检查控制台日志**：
   ```
   ✅ Conversion saved to database: [fileId]
   ```

---

## 🔍 调试技巧

### 如果仍然出现 404 错误

1. **检查数据库记录是否创建**：
   ```sql
   SELECT file_id, status, progress, created_at 
   FROM conversions 
   WHERE file_id = 'your-file-id';
   ```

2. **检查服务器日志**：
   ```
   应该看到: "✅ Conversion saved to database: [fileId]"
   如果没有，说明保存失败
   ```

3. **检查 Supabase 配置**：
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. **检查 RLS 策略**：
   ```sql
   -- 确保匿名用户可以插入
   SELECT * FROM pg_policies WHERE tablename = 'conversions';
   ```

---

## 📝 相关文件

### 修改的文件
- ✅ `src/app/api/convert/process/route.ts` - 添加数据库保存逻辑
- ✅ `src/app/api/convert/result/[id]/route.ts` - 添加数据库读取逻辑
- ✅ `src/app/[locale]/convert/client.tsx` - 传递文件信息

### 相关文档
- `CONVERSION_SYSTEM.md` - 转换系统文档
- `WORKSPACE_DATABASE_ANALYSIS.md` - 数据库分析
- `PERSISTENCE_FIX_SUMMARY.md` - 持久化修复总结

---

## ✅ 总结

### 问题
- ❌ 转换结果只存储在内存中
- ❌ 刷新页面后数据丢失
- ❌ 返回 404 错误

### 解决方案
- ✅ 在转换开始时创建数据库记录
- ✅ 在转换过程中更新进度
- ✅ 在转换完成时保存结果
- ✅ 优先从内存读取，回退到数据库
- ✅ 支持匿名用户（24 小时过期）
- ✅ 支持登录用户（永久保存）

### 验证
- ✅ 上传文件并转换
- ✅ 刷新页面，数据仍然存在
- ✅ 数据库中有转换记录
- ✅ 控制台显示保存成功日志

