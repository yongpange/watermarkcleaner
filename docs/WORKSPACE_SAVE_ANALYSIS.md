# 📊 Workspace 页面 Save 功能数据存储分析

## 问题概述

用户在 `/workspace` 页面点击 "Save" 按钮后，系统显示 "Document saved successfully" 提示消息。本文档详细分析数据的实际存储位置和持久化机制。

---

## 🔍 核心发现

### ⚠️ **重要结论：数据并未真正保存到数据库**

当前的 Save 功能**仅仅是一个模拟操作**，数据只保存到浏览器的 **sessionStorage**（通过 Zustand store），并未持久化到 PostgreSQL 数据库。

---

## 📝 详细分析

### 1. Save 按钮的处理逻辑

**文件位置**：`src/app/[locale]/workspace/client.tsx`（第 67-87 行）

```typescript
const handleSave = async () => {
  setIsSaving(true);
  
  // ❌ 模拟保存（注释明确说明：in production, save to database）
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // ⚠️ 仅更新 Zustand store（sessionStorage）
  if (fileId) {
    const conversion = conversions.get(fileId);
    if (conversion) {
      conversion.result = {
        ...conversion.result!,
        content,  // 更新的 Markdown 内容
      };
      // Note: You'd need to add an update method to the store
    }
  }
  
  setIsSaving(false);
  toast.success("Document saved successfully");  // ❌ 误导性提示
};
```

**关键问题**：
1. ❌ **没有 API 调用**：没有 `fetch()` 或 `axios` 请求
2. ❌ **没有数据库操作**：没有调用任何数据库 API 路由
3. ⚠️ **仅模拟延迟**：`setTimeout(1000)` 只是为了模拟网络请求
4. ⚠️ **直接修改对象**：直接修改 `conversion.result`，没有调用 store 的 `updateConversion` 方法

---

### 2. 数据存储位置

#### ✅ **实际存储位置：浏览器 sessionStorage**

**文件位置**：`src/stores/conversion-store.ts`（第 28-129 行）

```typescript
export const useConversionStore = create<ConversionStore>()(
  persist(
    (set, get) => ({
      files: new Map(),
      conversions: new Map(),
      // ... actions
    }),
    {
      name: 'conversion-store',
      storage: createJSONStorage(() => sessionStorage, {  // ⚠️ 使用 sessionStorage
        reviver: (key, value) => {
          if (key === 'files' || key === 'conversions') {
            return new Map(value);
          }
          return value;
        },
        replacer: (key, value) => {
          if (value instanceof Map) {
            return Array.from(value.entries());
          }
          return value;
        },
      }),
    }
  )
);
```

**存储机制**：
- **存储引擎**：`sessionStorage`（浏览器会话存储）
- **存储键名**：`conversion-store`
- **数据结构**：JSON 序列化的 Map 对象
- **持久化方式**：Zustand 的 `persist` 中间件自动同步

---

### 3. 数据持久化特性

#### ❌ **sessionStorage 的限制**

| 特性 | sessionStorage | localStorage | 数据库 |
|------|---------------|--------------|--------|
| **刷新页面** | ✅ 保留 | ✅ 保留 | ✅ 保留 |
| **关闭标签页** | ❌ 丢失 | ✅ 保留 | ✅ 保留 |
| **关闭浏览器** | ❌ 丢失 | ✅ 保留 | ✅ 保留 |
| **跨标签页共享** | ❌ 不共享 | ✅ 共享 | ✅ 共享 |
| **与用户账号关联** | ❌ 否 | ❌ 否 | ✅ 是 |
| **存储容量** | ~5-10MB | ~5-10MB | 无限制 |
| **数据安全性** | ❌ 低 | ❌ 低 | ✅ 高 |

**当前实现的问题**：
1. ❌ **关闭标签页后数据丢失**
2. ❌ **无法跨设备访问**
3. ❌ **不与用户账号关联**
4. ❌ **无法多人协作**
5. ❌ **无法恢复历史版本**

---

### 4. 数据库表结构分析

#### ✅ **数据库已有 `conversions` 表**

**文件位置**：`src/db/schema.ts`（第 136-160 行）

```typescript
export const conversions = pgTable(
  "conversions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }), // Nullable for anonymous users
    file_id: varchar({ length: 255 }).notNull(),
    file_name: varchar({ length: 500 }).notNull(),
    file_size: bigint({ mode: "number" }).notNull(),
    file_type: varchar({ length: 100 }).notNull(),
    file_url: text(),
    status: varchar({ length: 50 }).notNull().default("pending"),
    progress: integer().notNull().default(0),
    result: jsonb(), // ✅ 可以存储 ConversionResultData（包括 content）
    error: jsonb(),
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    completed_at: timestamp({ withTimezone: true }),
    expires_at: timestamp({ withTimezone: true }), // For anonymous users (24h)
  },
  (table) => [
    index("conversions_user_uuid_idx").on(table.user_uuid),
    index("conversions_status_idx").on(table.status),
    index("conversions_created_at_idx").on(table.created_at),
  ]
);
```

**表结构特点**：
- ✅ **已存在**：数据库表已创建（migration `0001_icy_zzzax.sql`）
- ✅ **支持用户关联**：`user_uuid` 字段
- ✅ **支持匿名用户**：`user_uuid` 可为空
- ✅ **支持 JSON 存储**：`result` 字段为 `jsonb` 类型，可存储完整的转换结果
- ✅ **支持过期时间**：`expires_at` 字段（匿名用户 24 小时）
- ✅ **有索引优化**：用户、状态、创建时间都有索引

---

### 5. 缺失的 API 路由

#### ❌ **没有保存到数据库的 API**

**当前 API 路由**：
- ✅ `/api/convert/upload` - 上传文件
- ✅ `/api/convert/process` - 处理转换
- ❌ `/api/convert/save` - **不存在**（需要创建）
- ❌ `/api/workspace/save` - **不存在**（需要创建）

**需要创建的 API**：
```typescript
// src/app/api/workspace/save/route.ts
export async function POST(request: NextRequest) {
  // 1. 获取用户信息（如果已登录）
  // 2. 获取文档内容
  // 3. 保存到 conversions 表
  // 4. 返回成功响应
}
```

---

## 🔄 数据流向图

### 当前实现（仅 sessionStorage）

```
用户点击 Save
    ↓
handleSave() 函数
    ↓
模拟延迟 1 秒
    ↓
直接修改 conversion.result.content
    ↓
Zustand persist 中间件自动同步
    ↓
保存到 sessionStorage['conversion-store']
    ↓
显示 "Document saved successfully" ✅
    ↓
❌ 关闭标签页 → 数据丢失
```

### 应该实现的流程（数据库持久化）

```
用户点击 Save
    ↓
handleSave() 函数
    ↓
调用 POST /api/workspace/save
    ↓
API 路由处理：
  - 验证用户身份（可选）
  - 获取文档内容
  - 保存到 PostgreSQL conversions 表
    ↓
返回成功响应
    ↓
更新 Zustand store（本地缓存）
    ↓
显示 "Document saved successfully" ✅
    ↓
✅ 关闭标签页 → 数据仍在数据库
✅ 跨设备访问 → 可以读取
✅ 用户账号关联 → 永久保存
```

---

## 🐛 当前问题总结

### 问题 1: 误导性提示消息
- **现象**：显示 "Document saved successfully"
- **实际**：只保存到 sessionStorage，未保存到数据库
- **影响**：用户误以为数据已永久保存

### 问题 2: 数据易丢失
- **现象**：关闭标签页后数据消失
- **原因**：使用 sessionStorage 而非数据库
- **影响**：用户编辑的内容可能意外丢失

### 问题 3: 无法跨设备访问
- **现象**：在另一台设备无法访问文档
- **原因**：数据存储在浏览器本地
- **影响**：无法实现多设备同步

### 问题 4: 不与用户账号关联
- **现象**：登录后无法查看历史文档
- **原因**：未保存到数据库的 user_uuid 字段
- **影响**：无法实现用户文档管理

### 问题 5: 代码实现不规范
- **现象**：直接修改对象，未调用 store 方法
- **代码**：`conversion.result = { ...conversion.result!, content }`
- **应该**：调用 `updateConversion(fileId, { result: { content } })`

---

## ✅ 解决方案建议

### 方案 1: 完整数据库持久化（推荐）

**优点**：
- ✅ 数据永久保存
- ✅ 支持用户账号关联
- ✅ 支持跨设备访问
- ✅ 支持历史版本管理

**实现步骤**：
1. 创建 API 路由：`src/app/api/workspace/save/route.ts`
2. 修改 `handleSave` 函数，调用 API
3. 使用 Zustand store 的 `updateConversion` 方法
4. 添加错误处理和重试机制

### 方案 2: 混合存储（快速方案）

**优点**：
- ✅ 本地缓存提升性能
- ✅ 数据库保证持久化
- ✅ 离线编辑支持

**实现步骤**：
1. 保留 sessionStorage 作为本地缓存
2. 同时保存到数据库
3. 页面加载时优先从数据库读取
4. 定期自动保存（每 30 秒）

### 方案 3: 仅修改提示消息（临时方案）

**优点**：
- ✅ 快速修复误导性提示
- ✅ 不需要后端开发

**实现步骤**：
1. 修改提示消息为 "Document cached locally"
2. 添加警告："Data will be lost when closing the tab"
3. 提示用户导出文档

---

## 📋 推荐实现清单

### 立即修复（高优先级）

- [ ] 修改 `handleSave` 函数，使用 `updateConversion` 方法
- [ ] 修改提示消息，明确说明数据仅保存到本地
- [ ] 添加警告提示：关闭标签页会丢失数据

### 短期优化（中优先级）

- [ ] 创建 `/api/workspace/save` API 路由
- [ ] 实现数据库保存逻辑
- [ ] 添加用户身份验证（可选）
- [ ] 实现自动保存功能（每 30 秒）

### 长期改进（低优先级）

- [ ] 实现历史版本管理
- [ ] 添加协作编辑功能
- [ ] 实现离线编辑同步
- [ ] 添加冲突解决机制

---

## 🔧 示例代码

### 修复后的 handleSave 函数

```typescript
const handleSave = async () => {
  setIsSaving(true);
  
  try {
    // 调用 API 保存到数据库
    const response = await fetch('/api/workspace/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        content,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save document');
    }

    // 更新 Zustand store（使用正确的方法）
    if (fileId) {
      useConversionStore.getState().updateConversion(fileId, {
        result: {
          content,
          format: 'markdown',
          metadata,
        },
      });
    }

    toast.success("Document saved successfully");
  } catch (error) {
    console.error("Save error:", error);
    toast.error("Failed to save document");
  } finally {
    setIsSaving(false);
  }
};
```

---

**文档创建时间**: 2025-10-30  
**分析范围**: Workspace 页面 Save 功能  
**状态**: ⚠️ **数据未真正保存到数据库**  
**建议**: 尽快实现数据库持久化

