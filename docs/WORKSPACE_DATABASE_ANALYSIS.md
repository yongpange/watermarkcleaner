# 📊 Workspace 功能数据库设计全面分析报告

**项目**: ai-turbolearn-template  
**数据库**: PostgreSQL (Supabase)  
**ORM**: Drizzle ORM  
**分析日期**: 2025-11-04  
**分析范围**: Document、Chatbot、Flashcards、Quiz 四个模式的数据存储需求

---

## 📋 目录

1. [现有数据库结构分析](#1-现有数据库结构分析)
2. [各功能模块数据需求分析](#2-各功能模块数据需求分析)
3. [新表设计方案](#3-新表设计方案)
4. [潜在问题识别](#4-潜在问题识别)
5. [迁移策略](#5-迁移策略)
6. [最佳实践建议](#6-最佳实践建议)

---

## 1. 现有数据库结构分析

### 1.1 已有表结构概览

当前数据库共有 **9 个表**：

| 表名 | 用途 | 状态 | 关联 Workspace |
|------|------|------|----------------|
| `users` | 用户信息 | ✅ 已完善 | 间接关联 |
| `orders` | 订单记录 | ✅ 已完善 | 无关联 |
| `credits` | 积分记录 | ✅ 已完善 | 无关联 |
| `apikeys` | API 密钥 | ✅ 已完善 | 无关联 |
| `posts` | 博客文章 | ✅ 已完善 | 无关联 |
| `affiliates` | 联盟营销 | ✅ 已完善 | 无关联 |
| `feedbacks` | 用户反馈 | ✅ 已完善 | 无关联 |
| `conversions` | 文档转换 | ✅ 已完善 | **核心表** |
| `chat_sessions` | 聊天会话 | ✅ 已完善 | **核心表** |
| `user_preferences` | 用户偏好 | ✅ 已完善 | 间接关联 |

### 1.2 核心表详细分析

#### 1.2.1 `conversions` 表（文档转换）

**表结构**:
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
  "expires_at" timestamp with time zone        -- 匿名用户 24h 过期
);

-- 索引
CREATE INDEX "conversions_user_uuid_idx" ON "conversions" ("user_uuid");
CREATE INDEX "conversions_status_idx" ON "conversions" ("status");
CREATE INDEX "conversions_created_at_idx" ON "conversions" ("created_at");
```

**`result` 字段（jsonb）当前结构**:
```typescript
{
  content: string,              // Markdown 内容
  metadata: {
    language: string,           // 语言（en/zh）
    wordCount: number,          // 字数
    pageCount?: number,         // 页数（PDF）
    detectedFormat: string,     // 原始格式
    processingTime?: number,    // 处理时间（ms）
    lastSaved?: string,         // 最后保存时间
  },
  sections?: Array<{            // 章节（可选）
    title: string,
    content: string,
    level: number,
  }>,
  aiSummary?: string,           // ✅ AI 学习笔记（已实现）
  aiSummaryGeneratedAt?: string,// ✅ 生成时间
  aiSummaryVersion?: number,    // ✅ 版本号
}
```

**优点**:
- ✅ 使用 `jsonb` 类型，灵活存储复杂数据
- ✅ 支持匿名用户（`user_uuid` 可为空）
- ✅ 有完善的索引（用户、状态、时间）
- ✅ 支持过期时间（匿名用户 24 小时）
- ✅ 已实现 AI 学习笔记存储

**不足**:
- ⚠️ `result` 字段混合了多种数据（文档内容 + AI 笔记），缺乏结构化
- ⚠️ 没有版本控制机制（AI 笔记更新会覆盖旧版本）
- ⚠️ 缺少文档元数据的独立字段（如标题、描述）

#### 1.2.2 `chat_sessions` 表（聊天会话）

**表结构**:
```sql
CREATE TABLE "chat_sessions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "uuid" varchar(255) NOT NULL UNIQUE,
  "user_uuid" varchar(255),                    -- 用户 ID（可为空）
  "file_id" varchar(255) NOT NULL,             -- 关联文档
  "messages" jsonb NOT NULL DEFAULT '[]',      -- ✅ 聊天消息数组
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "expires_at" timestamp with time zone,       -- 匿名用户 24h 过期
  "message_count" integer DEFAULT 0 NOT NULL,  -- 消息数量（缓存）
  "last_message_at" timestamp with time zone   -- 最后消息时间
);

-- 索引
CREATE INDEX "chat_sessions_user_uuid_idx" ON "chat_sessions" ("user_uuid");
CREATE INDEX "chat_sessions_file_id_idx" ON "chat_sessions" ("file_id");
CREATE INDEX "chat_sessions_created_at_idx" ON "chat_sessions" ("created_at");
```

**`messages` 字段（jsonb）结构**:
```typescript
[
  {
    role: 'user' | 'assistant',
    content: string,
    timestamp: string,          // ISO 8601 格式
  }
]
```

**优点**:
- ✅ 完整的聊天会话管理
- ✅ 支持匿名用户和过期时间
- ✅ 有缓存字段（`message_count`、`last_message_at`）提升查询性能
- ✅ 索引完善（用户、文档、时间）
- ✅ 已实现完整的 CRUD API

**不足**:
- ⚠️ 所有消息存储在单个 `jsonb` 字段，大量消息时可能影响性能
- ⚠️ 缺少消息级别的元数据（如消息 ID、编辑状态、点赞等）
- ⚠️ 无法高效查询特定消息内容（需要扫描整个 jsonb 数组）
- ⚠️ 一个文档只能有一个会话（无法支持多会话场景）

---

## 2. 各功能模块数据需求分析

### 2.1 Document 模式 - AI 学习笔记

#### 当前实现状态
- ✅ **已实现**: AI 学习笔记存储在 `conversions.result.aiSummary`
- ✅ **API 路由**: `/api/workspace/ai-summary` (GET/POST)
- ✅ **版本控制**: 简单的版本号（`aiSummaryVersion`）

#### 数据需求分析

**核心数据**:
- AI 生成的学习笔记内容（Markdown 格式）
- 生成时间、更新时间
- 版本号（支持历史记录）
- 与原始文档的关联（fileId）
- 与用户的关联（userId）

**扩展需求**:
- 笔记编辑历史（用户可能手动修改 AI 笔记）
- 笔记分享状态（公开/私有）
- 笔记标签/分类
- 笔记导出格式偏好

#### 当前方案评估

**优点**:
- ✅ 简单直接，无需额外表
- ✅ 与文档数据紧密关联
- ✅ 查询效率高（单表查询）

**缺点**:
- ❌ 无法保存编辑历史（每次更新覆盖旧版本）
- ❌ 无法支持多版本笔记（如不同 AI 模型生成的笔记）
- ❌ 无法独立管理笔记（如批量删除、导出）
- ❌ `result` 字段混合了多种数据，不够清晰

#### 建议方案

**方案 A**: 继续使用 `conversions.result`（推荐用于当前阶段）
- 适用场景：简单的 AI 笔记存储，无需复杂功能
- 优点：无需数据库迁移，实现简单
- 缺点：扩展性有限

**方案 B**: 创建独立的 `ai_summaries` 表（推荐用于未来扩展）
- 适用场景：需要版本控制、编辑历史、多版本笔记
- 优点：结构清晰，扩展性强
- 缺点：需要数据库迁移，增加查询复杂度

### 2.2 Chatbot 模式 - 聊天记录

#### 当前实现状态
- ✅ **已实现**: 完整的聊天会话管理
- ✅ **表**: `chat_sessions`
- ✅ **API 路由**: `/api/workspace/chat-session` (GET/POST/DELETE)
- ✅ **功能**: 自动保存、加载历史、防抖优化

#### 数据需求分析

**核心数据**:
- 聊天消息（role, content, timestamp）
- 会话元数据（创建时间、更新时间、消息数量）
- 与文档的关联（fileId）
- 与用户的关联（userId）
- 过期时间（匿名用户）

**扩展需求**:
- 多会话支持（一个文档可以有多个聊天会话）
- 会话标题/描述（用户可以命名会话）
- 消息搜索（全文搜索聊天内容）
- 消息编辑/删除（用户可以修改或删除消息）
- 消息点赞/收藏（标记重要消息）
- 会话分享（分享聊天记录给其他用户）

#### 当前方案评估

**优点**:
- ✅ 完整的会话管理
- ✅ 性能优化（缓存字段）
- ✅ 支持匿名用户
- ✅ 索引完善

**缺点**:
- ❌ 一个文档只能有一个会话（查询逻辑：`WHERE file_id = ? ORDER BY updated_at LIMIT 1`）
- ❌ 消息存储在 jsonb 数组，无法高效查询单条消息
- ❌ 无法支持消息级别的操作（编辑、删除、点赞）
- ❌ 大量消息时，jsonb 数组可能影响性能

#### 建议方案

**方案 A**: 继续使用当前方案（推荐用于当前阶段）
- 适用场景：简单的聊天功能，消息量不大（< 100 条/会话）
- 优点：实现简单，查询效率高
- 缺点：扩展性有限

**方案 B**: 拆分为 `chat_sessions` + `chat_messages` 两表（推荐用于未来扩展）
- 适用场景：需要消息级别操作、大量消息、多会话支持
- 优点：结构清晰，扩展性强，查询灵活
- 缺点：需要数据库迁移，查询复杂度增加

### 2.3 Flashcards 功能 - 闪卡数据

#### 当前实现状态
- ❌ **未实现**: 闪卡数据未持久化
- ✅ **API 路由**: `/api/workspace/flashcards/generate` (仅生成，不保存)
- ❌ **存储**: 仅在前端状态中，刷新页面丢失

#### 数据需求分析

**核心数据**:
- 闪卡基本信息（question, answer, explanation）
- 与文档的关联（fileId）
- 与用户的关联（userId）
- 生成时间、更新时间
- 闪卡顺序（order）

**学习进度跟踪**:
- 查看次数（views）
- 掌握程度（mastery: 0-100）
- 上次复习时间（lastReviewedAt）
- 下次复习时间（nextReviewAt）
- 间隔重复算法参数：
  - `easeFactor`: 难度系数（默认 2.5）
  - `interval`: 复习间隔（天数）
  - `repetitions`: 重复次数

**扩展功能**:
- 收藏状态（isFavorited）
- 自定义闪卡 vs AI 生成（source: 'ai' | 'manual'）
- 闪卡集合/卡组（deck）概念
- 闪卡标签（tags）
- 闪卡分享（公开/私有）

#### 建议方案

**必须创建新表**: `flashcards`

**理由**:
- ❌ 不适合存储在 `conversions.result`（闪卡数量多，结构复杂）
- ❌ 不适合存储在 `chat_sessions`（完全不同的数据类型）
- ✅ 需要独立的表来支持 CRUD 操作
- ✅ 需要支持学习进度跟踪（SRS 算法）
- ✅ 需要支持收藏、标签等扩展功能

### 2.4 文档管理 - 上传文件元数据

#### 当前实现状态
- ✅ **已实现**: `conversions` 表存储文档元数据
- ✅ **字段**: file_id, file_name, file_size, file_type, file_url, status, progress

#### 数据需求分析

**核心数据**:
- 文档基本信息（文件名、类型、大小、URL）
- 转换状态（pending, processing, completed, failed）
- 转换进度（0-100）
- 创建时间、完成时间
- 与用户的关联

**扩展需求**:
- 文档标题/描述（用户可编辑）
- 文档标签/分类
- 文档分享状态（公开/私有/协作）
- 文档访问权限（所有者、协作者、查看者）
- 文档统计（查看次数、下载次数）
- 文档版本控制（支持多次上传同一文档）

#### 当前方案评估

**优点**:
- ✅ 完整的文档元数据存储
- ✅ 支持转换状态跟踪
- ✅ 支持匿名用户

**缺点**:
- ❌ 缺少文档标题/描述字段（只有 file_name）
- ❌ 缺少文档分类/标签
- ❌ 缺少分享和权限管理
- ❌ 缺少文档统计数据

#### 建议方案

**方案 A**: 扩展 `conversions` 表（推荐）
- 添加字段：`title`, `description`, `tags`, `is_public`, `view_count`
- 优点：无需新表，实现简单
- 缺点：表字段增多

**方案 B**: 创建 `documents` 表 + 保留 `conversions` 表
- `documents`: 文档元数据和业务逻辑
- `conversions`: 仅用于转换任务跟踪
- 优点：职责分离，结构清晰
- 缺点：增加复杂度，需要关联查询

---

## 3. 新表设计方案

### 3.1 `flashcards` 表（必须创建）

**Drizzle ORM Schema**:
```typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const flashcards = pgTable(
  "flashcards",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    
    // 关联关系
    user_uuid: varchar({ length: 255 }),              // 用户 ID（可为空）
    file_id: varchar({ length: 255 }).notNull(),      // 关联文档
    
    // 闪卡内容
    question: text().notNull(),                       // 问题
    answer: text().notNull(),                         // 答案
    explanation: text(),                              // 解释（可选）
    
    // 元数据
    source: varchar({ length: 20 }).notNull().default('ai'),  // 'ai' | 'manual'
    order: integer().notNull().default(0),            // 顺序
    
    // 学习进度（SRS 算法）
    views: integer().notNull().default(0),            // 查看次数
    mastery: integer().notNull().default(0),          // 掌握程度 0-100
    ease_factor: real().notNull().default(2.5),       // 难度系数
    interval: integer().notNull().default(0),         // 复习间隔（天）
    repetitions: integer().notNull().default(0),      // 重复次数
    last_reviewed_at: timestamp({ withTimezone: true }),  // 上次复习时间
    next_review_at: timestamp({ withTimezone: true }),    // 下次复习时间
    
    // 扩展功能
    is_favorited: boolean().notNull().default(false), // 收藏状态
    tags: varchar({ length: 500 }),                   // 标签（逗号分隔）
    
    // 时间戳
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
    expires_at: timestamp({ withTimezone: true }),    // 匿名用户 24h 过期
  },
  (table) => [
    index("flashcards_user_uuid_idx").on(table.user_uuid),
    index("flashcards_file_id_idx").on(table.file_id),
    index("flashcards_next_review_idx").on(table.next_review_at),
    index("flashcards_created_at_idx").on(table.created_at),
    uniqueIndex("flashcards_file_order_idx").on(table.file_id, table.order),
  ]
);
```

**SQL Migration**:
```sql
CREATE TABLE "flashcards" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "uuid" varchar(255) NOT NULL UNIQUE,
  "user_uuid" varchar(255),
  "file_id" varchar(255) NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "explanation" text,
  "source" varchar(20) DEFAULT 'ai' NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "views" integer DEFAULT 0 NOT NULL,
  "mastery" integer DEFAULT 0 NOT NULL,
  "ease_factor" real DEFAULT 2.5 NOT NULL,
  "interval" integer DEFAULT 0 NOT NULL,
  "repetitions" integer DEFAULT 0 NOT NULL,
  "last_reviewed_at" timestamp with time zone,
  "next_review_at" timestamp with time zone,
  "is_favorited" boolean DEFAULT false NOT NULL,
  "tags" varchar(500),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "expires_at" timestamp with time zone
);

CREATE INDEX "flashcards_user_uuid_idx" ON "flashcards" ("user_uuid");
CREATE INDEX "flashcards_file_id_idx" ON "flashcards" ("file_id");
CREATE INDEX "flashcards_next_review_idx" ON "flashcards" ("next_review_at");
CREATE INDEX "flashcards_created_at_idx" ON "flashcards" ("created_at");
CREATE UNIQUE INDEX "flashcards_file_order_idx" ON "flashcards" ("file_id", "order");
```

**设计说明**:
1. **主键**: 自增 ID + UUID（UUID 用于外部引用）
2. **关联**: `user_uuid` + `file_id`（支持匿名用户）
3. **SRS 算法**: 完整的间隔重复算法字段
4. **索引**: 用户、文档、复习时间、创建时间
5. **唯一约束**: `(file_id, order)` 确保同一文档的闪卡顺序唯一
6. **过期时间**: 匿名用户 24 小时自动清理

### 3.2 `flashcard_decks` 表（可选，未来扩展）

**用途**: 支持闪卡集合/卡组功能

**Schema**:
```typescript
export const flashcardDecks = pgTable(
  "flashcard_decks",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }),
    
    name: varchar({ length: 255 }).notNull(),         // 卡组名称
    description: text(),                              // 卡组描述
    color: varchar({ length: 20 }),                   // 卡组颜色
    icon: varchar({ length: 50 }),                    // 卡组图标
    
    is_public: boolean().notNull().default(false),    // 公开状态
    flashcard_count: integer().notNull().default(0),  // 闪卡数量（缓存）
    
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("flashcard_decks_user_uuid_idx").on(table.user_uuid),
  ]
);

// 关联表：闪卡 <-> 卡组（多对多）
export const flashcardDeckItems = pgTable(
  "flashcard_deck_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    deck_uuid: varchar({ length: 255 }).notNull(),
    flashcard_uuid: varchar({ length: 255 }).notNull(),
    order: integer().notNull().default(0),
    added_at: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("flashcard_deck_items_deck_idx").on(table.deck_uuid),
    index("flashcard_deck_items_flashcard_idx").on(table.flashcard_uuid),
    uniqueIndex("flashcard_deck_items_unique_idx").on(table.deck_uuid, table.flashcard_uuid),
  ]
);
```

### 3.3 `ai_summaries` 表（可选，未来扩展）

**用途**: 独立管理 AI 学习笔记，支持版本控制

**Schema**:
```typescript
export const aiSummaries = pgTable(
  "ai_summaries",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    
    // 关联
    user_uuid: varchar({ length: 255 }),
    file_id: varchar({ length: 255 }).notNull(),
    
    // 内容
    content: text().notNull(),                        // Markdown 内容
    version: integer().notNull().default(1),          // 版本号
    
    // 元数据
    model: varchar({ length: 50 }),                   // AI 模型（deepseek-chat）
    tokens_used: integer(),                           // 使用的 token 数
    generation_time: integer(),                       // 生成时间（ms）
    
    // 状态
    is_current: boolean().notNull().default(true),    // 是否为当前版本
    is_edited: boolean().notNull().default(false),    // 是否被用户编辑
    
    // 时间戳
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("ai_summaries_user_uuid_idx").on(table.user_uuid),
    index("ai_summaries_file_id_idx").on(table.file_id),
    index("ai_summaries_is_current_idx").on(table.is_current),
  ]
);
```

### 3.4 `chat_messages` 表（可选，未来扩展）

**用途**: 拆分聊天消息，支持消息级别操作

**Schema**:
```typescript
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    
    // 关联
    session_uuid: varchar({ length: 255 }).notNull(), // 关联会话
    
    // 消息内容
    role: varchar({ length: 20 }).notNull(),          // 'user' | 'assistant'
    content: text().notNull(),                        // 消息内容
    
    // 元数据
    tokens_used: integer(),                           // 使用的 token 数
    model: varchar({ length: 50 }),                   // AI 模型
    
    // 扩展功能
    is_edited: boolean().notNull().default(false),    // 是否被编辑
    is_deleted: boolean().notNull().default(false),   // 软删除
    is_favorited: boolean().notNull().default(false), // 收藏
    
    // 时间戳
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("chat_messages_session_uuid_idx").on(table.session_uuid),
    index("chat_messages_created_at_idx").on(table.created_at),
  ]
);
```

---

## 4. 潜在问题识别

### 4.1 当前实现的问题

#### 问题 1: Document 模式 - 无版本控制
**描述**: AI 学习笔记存储在 `conversions.result.aiSummary`，每次更新覆盖旧版本

**影响**:
- ❌ 用户无法查看历史版本
- ❌ 无法回滚到之前的笔记
- ❌ 无法比较不同版本的差异

**解决方案**:
- **短期**: 在 `result` 中添加 `aiSummaryHistory` 数组
- **长期**: 创建 `ai_summaries` 表，支持完整的版本控制

#### 问题 2: Chatbot 模式 - 单会话限制
**描述**: 查询逻辑 `WHERE file_id = ? ORDER BY updated_at LIMIT 1` 导致一个文档只能有一个会话

**影响**:
- ❌ 用户无法创建多个聊天会话
- ❌ 无法按主题组织对话
- ❌ 无法保留不同的对话历史

**解决方案**:
- **短期**: 修改查询逻辑，支持多会话（添加会话列表 UI）
- **长期**: 添加会话管理功能（创建、重命名、删除会话）

#### 问题 3: Flashcards 功能 - 无持久化
**描述**: 闪卡数据仅在前端状态中，刷新页面丢失

**影响**:
- ❌ 用户每次都需要重新生成闪卡
- ❌ 无法跟踪学习进度
- ❌ 无法实现间隔重复算法
- ❌ 浪费 API 调用（重复生成）

**解决方案**:
- **必须**: 创建 `flashcards` 表
- **必须**: 实现保存/加载 API
- **必须**: 实现学习进度跟踪

#### 问题 4: 性能问题 - JSONB 数组过大
**描述**: `chat_sessions.messages` 和 `conversions.result` 使用 jsonb 存储大量数据

**影响**:
- ⚠️ 大量消息时，查询性能下降
- ⚠️ 更新操作需要重写整个 jsonb 字段
- ⚠️ 无法高效查询 jsonb 内部数据

**解决方案**:
- **短期**: 限制消息数量（如最多 100 条）
- **长期**: 拆分为独立的消息表

#### 问题 5: 安全问题 - 缺少 RLS 策略
**描述**: 当前数据库没有 Row Level Security (RLS) 策略

**影响**:
- ⚠️ 用户可能访问其他用户的数据
- ⚠️ API 层面需要手动验证权限
- ⚠️ 容易出现安全漏洞

**解决方案**:
- **必须**: 在 Supabase 中启用 RLS
- **必须**: 为每个表添加 RLS 策略
- **必须**: 确保用户只能访问自己的数据

### 4.2 扩展性问题

#### 问题 6: 缺少文档分类和标签
**描述**: `conversions` 表缺少分类、标签字段

**影响**:
- ❌ 用户无法组织大量文档
- ❌ 无法按类别筛选文档
- ❌ 无法实现智能推荐

**解决方案**:
- 添加 `tags` 字段（varchar 或 jsonb）
- 添加 `category` 字段
- 创建 `document_tags` 关联表（多对多）

#### 问题 7: 缺少协作功能
**描述**: 无法分享文档或协作编辑

**影响**:
- ❌ 无法团队协作
- ❌ 无法分享学习笔记
- ❌ 无法评论或讨论

**解决方案**:
- 创建 `document_shares` 表
- 添加权限管理（owner, editor, viewer）
- 实现分享链接功能

---

## 5. 迁移策略

### 5.1 优先级划分

**P0 - 必须立即实现**:
1. ✅ 创建 `flashcards` 表
2. ✅ 实现 Flashcards 保存/加载 API
3. ✅ 添加 RLS 策略（安全）

**P1 - 短期实现（1-2 周）**:
1. 修复 Chatbot 单会话限制
2. 添加文档标签/分类字段
3. 实现 AI 笔记版本控制

**P2 - 中期实现（1-2 月）**:
1. 拆分 `chat_messages` 表
2. 创建 `ai_summaries` 表
3. 实现文档分享功能

**P3 - 长期实现（3+ 月）**:
1. 创建 `flashcard_decks` 表
2. 实现协作编辑功能
3. 添加全文搜索

### 5.2 迁移步骤（P0 - Flashcards 表）

**步骤 1**: 更新 `src/db/schema.ts`
```bash
# 添加 flashcards 表定义（见 3.1 节）
```

**步骤 2**: 生成迁移文件
```bash
pnpm db:generate
# 这将在 src/db/migrations/ 生成新的 SQL 文件
```

**步骤 3**: 执行迁移
```bash
pnpm db:migrate
# 这将在数据库中创建 flashcards 表
```

**步骤 4**: 创建 API 路由
```typescript
// src/app/api/workspace/flashcards/save/route.ts
// src/app/api/workspace/flashcards/load/route.ts
// src/app/api/workspace/flashcards/update/route.ts
// src/app/api/workspace/flashcards/delete/route.ts
```

**步骤 5**: 更新前端组件
```typescript
// src/components/workspace/FlashcardsView.tsx
// 添加保存/加载逻辑
```

**步骤 6**: 添加 RLS 策略（Supabase）
```sql
-- 启用 RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能访问自己的闪卡
CREATE POLICY "Users can view their own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid()::text = user_uuid OR user_uuid IS NULL);

CREATE POLICY "Users can insert their own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid()::text = user_uuid OR user_uuid IS NULL);

CREATE POLICY "Users can update their own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid()::text = user_uuid);

CREATE POLICY "Users can delete their own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid()::text = user_uuid);
```

### 5.3 向后兼容性

**原则**: 所有迁移必须保持向后兼容

**策略**:
1. ✅ 新增表不影响现有功能
2. ✅ 新增字段使用默认值
3. ✅ 保留旧的 API 路由（标记为 deprecated）
4. ✅ 逐步迁移数据（不强制）

---

## 6. 最佳实践建议

### 6.1 数据库设计原则

1. **使用 UUID 作为外部引用**
   - ✅ 主键使用自增 ID（性能）
   - ✅ 添加 UUID 字段用于外部引用（安全）
   - ✅ UUID 字段添加 UNIQUE 约束

2. **合理使用 JSONB**
   - ✅ 适用场景：灵活的元数据、配置信息
   - ❌ 不适用：需要频繁查询的结构化数据
   - ⚠️ 限制：避免存储大量数据（> 1MB）

3. **索引策略**
   - ✅ 为外键添加索引（user_uuid, file_id）
   - ✅ 为常用查询字段添加索引（created_at, status）
   - ✅ 为复合查询添加复合索引
   - ⚠️ 避免过度索引（影响写入性能）

4. **时间戳字段**
   - ✅ 使用 `timestamp with time zone`
   - ✅ 添加 `created_at` 和 `updated_at`
   - ✅ 使用 `defaultNow()` 自动设置

5. **软删除 vs 硬删除**
   - ✅ 重要数据使用软删除（`deleted_at` 字段）
   - ✅ 临时数据使用硬删除
   - ✅ 匿名用户数据使用 `expires_at` 自动清理

### 6.2 Supabase + Drizzle ORM 最佳实践

1. **使用 Drizzle ORM 的类型安全**
   ```typescript
   // ✅ 好的做法
   const result = await db()
     .select()
     .from(flashcards)
     .where(eq(flashcards.user_uuid, userUuid));
   
   // ❌ 避免使用原始 SQL（除非必要）
   const result = await db().execute(sql`SELECT * FROM flashcards WHERE user_uuid = ${userUuid}`);
   ```

2. **使用事务处理复杂操作**
   ```typescript
   await db().transaction(async (tx) => {
     await tx.insert(flashcards).values(newFlashcard);
     await tx.update(conversions).set({ flashcard_count: sql`flashcard_count + 1` });
   });
   ```

3. **使用 RLS 策略保护数据**
   - ✅ 在 Supabase 中启用 RLS
   - ✅ 为每个表添加策略
   - ✅ 在 API 中仍然验证权限（双重保护）

4. **优化查询性能**
   ```typescript
   // ✅ 使用 limit 限制结果数量
   .limit(100)
   
   // ✅ 使用 offset 实现分页
   .offset(page * pageSize)
   
   // ✅ 只查询需要的字段
   .select({ id: flashcards.id, question: flashcards.question })
   ```

5. **处理匿名用户**
   ```typescript
   // ✅ user_uuid 可为空
   user_uuid: varchar({ length: 255 }),
   
   // ✅ 添加过期时间
   expires_at: timestamp({ withTimezone: true }),
   
   // ✅ 定期清理过期数据（Cron Job）
   DELETE FROM flashcards WHERE expires_at < NOW();
   ```

### 6.3 API 设计最佳实践

1. **RESTful API 设计**
   ```typescript
   GET    /api/workspace/flashcards?fileId=xxx     // 获取列表
   POST   /api/workspace/flashcards                // 创建
   GET    /api/workspace/flashcards/[uuid]         // 获取单个
   PUT    /api/workspace/flashcards/[uuid]         // 更新
   DELETE /api/workspace/flashcards/[uuid]         // 删除
   ```

2. **统一的响应格式**
   ```typescript
   // 成功响应
   {
     success: true,
     data: { ... },
     message: "Operation successful"
   }
   
   // 错误响应
   {
     success: false,
     error: "Error message",
     details: "Detailed error information"
   }
   ```

3. **权限验证**
   ```typescript
   // 1. 获取用户信息
   const session = await auth();
   const userUuid = session?.user?.uuid;
   
   // 2. 验证权限
   if (!userUuid) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   
   // 3. 验证资源所有权
   const flashcard = await db().select().from(flashcards).where(eq(flashcards.uuid, uuid));
   if (flashcard.user_uuid !== userUuid) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

### 6.4 性能优化建议

1. **数据库查询优化**
   - ✅ 使用索引加速查询
   - ✅ 避免 N+1 查询问题
   - ✅ 使用缓存字段（如 `message_count`）
   - ✅ 分页查询大量数据

2. **JSONB 优化**
   - ✅ 使用 GIN 索引加速 jsonb 查询
   - ✅ 限制 jsonb 字段大小
   - ✅ 考虑拆分为独立表

3. **前端优化**
   - ✅ 使用防抖（debounce）减少 API 调用
   - ✅ 使用乐观更新提升用户体验
   - ✅ 使用 SWR 或 React Query 缓存数据

---

## 📊 总结

### 当前状态评估

| 功能模块 | 数据存储 | 完整性 | 扩展性 | 性能 | 安全性 |
|---------|---------|--------|--------|------|--------|
| Document (AI 笔记) | ✅ 已实现 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Chatbot (聊天) | ✅ 已实现 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Flashcards (闪卡) | ❌ 未实现 | ⭐ | ⭐ | N/A | N/A |
| 文档管理 | ✅ 已实现 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### 优先行动项

**立即执行（本周）**:
1. ✅ 创建 `flashcards` 表
2. ✅ 实现 Flashcards CRUD API
3. ✅ 添加 RLS 策略

**短期执行（2 周内）**:
1. 修复 Chatbot 单会话限制
2. 添加文档标签/分类
3. 实现 AI 笔记版本控制

**中期规划（1-2 月）**:
1. 优化 JSONB 性能
2. 实现文档分享功能
3. 添加全文搜索

---

## 7. 数据库关系图（ER Diagram）

### 7.1 当前数据库关系

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ uuid (UK)       │◄──────────┐
│ email           │           │
│ ...             │           │
└─────────────────┘           │
                              │
                              │ user_uuid (FK)
                              │
┌─────────────────┐           │
│  conversions    │           │
│─────────────────│           │
│ id (PK)         │           │
│ uuid (UK)       │           │
│ user_uuid       │───────────┘
│ file_id (UK)    │◄──────────┐
│ file_name       │           │
│ file_type       │           │
│ status          │           │
│ result (jsonb)  │           │ file_id (FK)
│ created_at      │           │
└─────────────────┘           │
                              │
                              │
┌─────────────────┐           │
│ chat_sessions   │           │
│─────────────────│           │
│ id (PK)         │           │
│ uuid (UK)       │           │
│ user_uuid       │───────────┤
│ file_id         │───────────┘
│ messages (jsonb)│
│ message_count   │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

### 7.2 新增 Flashcards 后的关系

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ uuid (UK)       │◄──────────┬──────────┬──────────┐
│ email           │           │          │          │
│ ...             │           │          │          │
└─────────────────┘           │          │          │
                              │          │          │
                              │          │          │
┌─────────────────┐           │          │          │
│  conversions    │           │          │          │
│─────────────────│           │          │          │
│ id (PK)         │           │          │          │
│ uuid (UK)       │           │          │          │
│ user_uuid       │───────────┘          │          │
│ file_id (UK)    │◄──────────┬──────────┘          │
│ file_name       │           │                     │
│ file_type       │           │                     │
│ status          │           │                     │
│ result (jsonb)  │           │                     │
│ created_at      │           │                     │
└─────────────────┘           │                     │
                              │                     │
                              │ file_id (FK)        │
                              │                     │
┌─────────────────┐           │                     │
│ chat_sessions   │           │                     │
│─────────────────│           │                     │
│ id (PK)         │           │                     │
│ uuid (UK)       │           │                     │
│ user_uuid       │───────────┼─────────────────────┘
│ file_id         │───────────┤
│ messages (jsonb)│           │
│ message_count   │           │
│ created_at      │           │
│ updated_at      │           │
└─────────────────┘           │
                              │
                              │
┌─────────────────┐           │
│   flashcards    │◄──────────┘ (NEW)
│─────────────────│
│ id (PK)         │
│ uuid (UK)       │
│ user_uuid       │───────────┐
│ file_id         │───────────┘
│ question        │
│ answer          │
│ explanation     │
│ order           │
│ views           │
│ mastery         │
│ ease_factor     │
│ interval        │
│ repetitions     │
│ last_reviewed_at│
│ next_review_at  │
│ is_favorited    │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

### 7.3 完整扩展后的关系（未来）

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ uuid (UK)       │◄──────────┬──────────┬──────────┬──────────┬──────────┐
│ email           │           │          │          │          │          │
│ ...             │           │          │          │          │          │
└─────────────────┘           │          │          │          │          │
                              │          │          │          │          │
┌─────────────────┐           │          │          │          │          │
│  conversions    │           │          │          │          │          │
│─────────────────│           │          │          │          │          │
│ id (PK)         │           │          │          │          │          │
│ uuid (UK)       │           │          │          │          │          │
│ user_uuid       │───────────┘          │          │          │          │
│ file_id (UK)    │◄──────────┬──────────┼──────────┼──────────┘          │
│ file_name       │           │          │          │                     │
│ title           │ (NEW)     │          │          │                     │
│ description     │ (NEW)     │          │          │                     │
│ tags            │ (NEW)     │          │          │                     │
│ is_public       │ (NEW)     │          │          │                     │
│ view_count      │ (NEW)     │          │          │                     │
│ result (jsonb)  │           │          │          │                     │
│ created_at      │           │          │          │                     │
└─────────────────┘           │          │          │                     │
                              │          │          │                     │
┌─────────────────┐           │          │          │                     │
│ chat_sessions   │           │          │          │                     │
│─────────────────│           │          │          │                     │
│ id (PK)         │           │          │          │                     │
│ uuid (UK)       │           │          │          │                     │
│ user_uuid       │───────────┼──────────┼──────────┼─────────────────────┘
│ file_id         │───────────┤          │          │
│ title           │ (NEW)     │          │          │
│ messages (jsonb)│           │          │          │
│ message_count   │           │          │          │
│ created_at      │           │          │          │
│ updated_at      │           │          │          │
└─────────────────┘           │          │          │
        │                     │          │          │
        │ session_uuid (FK)   │          │          │
        ▼                     │          │          │
┌─────────────────┐           │          │          │
│ chat_messages   │ (OPTIONAL)│          │          │
│─────────────────│           │          │          │
│ id (PK)         │           │          │          │
│ uuid (UK)       │           │          │          │
│ session_uuid    │───────────┘          │          │
│ role            │                      │          │
│ content         │                      │          │
│ is_favorited    │                      │          │
│ created_at      │                      │          │
└─────────────────┘                      │          │
                                         │          │
┌─────────────────┐                      │          │
│   flashcards    │                      │          │
│─────────────────│                      │          │
│ id (PK)         │                      │          │
│ uuid (UK)       │                      │          │
│ user_uuid       │──────────────────────┼──────────┘
│ file_id         │──────────────────────┘
│ question        │
│ answer          │
│ explanation     │
│ order           │
│ views           │
│ mastery         │
│ ease_factor     │
│ interval        │
│ repetitions     │
│ last_reviewed_at│
│ next_review_at  │
│ is_favorited    │
│ created_at      │
│ updated_at      │
└─────────────────┘
        │
        │ flashcard_uuid (FK)
        ▼
┌─────────────────┐
│flashcard_deck   │ (OPTIONAL)
│    _items       │
│─────────────────│
│ id (PK)         │
│ deck_uuid       │───────────┐
│ flashcard_uuid  │           │
│ order           │           │
│ added_at        │           │
└─────────────────┘           │
                              │
                              │ deck_uuid (FK)
                              ▼
┌─────────────────┐
│flashcard_decks  │ (OPTIONAL)
│─────────────────│
│ id (PK)         │
│ uuid (UK)       │
│ user_uuid       │───────────┐
│ name            │           │
│ description     │           │
│ is_public       │           │
│ flashcard_count │           │
│ created_at      │           │
└─────────────────┘           │
                              │
┌─────────────────┐           │
│  ai_summaries   │ (OPTIONAL)│
│─────────────────│           │
│ id (PK)         │           │
│ uuid (UK)       │           │
│ user_uuid       │───────────┘
│ file_id         │───────────┐
│ content         │           │
│ version         │           │
│ is_current      │           │
│ is_edited       │           │
│ created_at      │           │
└─────────────────┘           │
                              │
                              └──────────┐
                                         │
                              ┌──────────┘
                              │
                    (关联到 conversions.file_id)
```

---

## 8. 实施指南

### 8.1 Phase 1: Flashcards 表创建（必须）

**时间估计**: 2-3 天

#### Step 1: 更新 Schema 定义

**文件**: `src/db/schema.ts`

在文件末尾添加：

```typescript
// Flashcards table - stores learning flashcards
export const flashcards = pgTable(
  "flashcards",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),

    // 关联关系
    user_uuid: varchar({ length: 255 }),              // 用户 ID（可为空）
    file_id: varchar({ length: 255 }).notNull(),      // 关联文档

    // 闪卡内容
    question: text().notNull(),                       // 问题
    answer: text().notNull(),                         // 答案
    explanation: text(),                              // 解释（可选）

    // 元数据
    source: varchar({ length: 20 }).notNull().default('ai'),  // 'ai' | 'manual'
    order: integer().notNull().default(0),            // 顺序

    // 学习进度（SRS 算法）
    views: integer().notNull().default(0),            // 查看次数
    mastery: integer().notNull().default(0),          // 掌握程度 0-100
    ease_factor: real().notNull().default(2.5),       // 难度系数
    interval: integer().notNull().default(0),         // 复习间隔（天）
    repetitions: integer().notNull().default(0),      // 重复次数
    last_reviewed_at: timestamp({ withTimezone: true }),  // 上次复习时间
    next_review_at: timestamp({ withTimezone: true }),    // 下次复习时间

    // 扩展功能
    is_favorited: boolean().notNull().default(false), // 收藏状态
    tags: varchar({ length: 500 }),                   // 标签（逗号分隔）

    // 时间戳
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
    expires_at: timestamp({ withTimezone: true }),    // 匿名用户 24h 过期
  },
  (table) => [
    index("flashcards_user_uuid_idx").on(table.user_uuid),
    index("flashcards_file_id_idx").on(table.file_id),
    index("flashcards_next_review_idx").on(table.next_review_at),
    index("flashcards_created_at_idx").on(table.created_at),
    uniqueIndex("flashcards_file_order_idx").on(table.file_id, table.order),
  ]
);
```

#### Step 2: 生成迁移文件

```bash
cd e:\1_CODE\ai-turbolearn-template
pnpm db:generate
```

这将在 `src/db/migrations/` 生成新的 SQL 文件，例如：
- `0003_add_flashcards_table.sql`

#### Step 3: 执行迁移

```bash
pnpm db:migrate
```

这将在 Supabase 数据库中创建 `flashcards` 表。

#### Step 4: 添加 RLS 策略（Supabase Dashboard）

登录 Supabase Dashboard，执行以下 SQL：

```sql
-- 启用 RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- 策略 1: 用户可以查看自己的闪卡（包括匿名用户）
CREATE POLICY "Users can view their own flashcards"
  ON flashcards FOR SELECT
  USING (
    auth.uid()::text = user_uuid
    OR user_uuid IS NULL
  );

-- 策略 2: 用户可以插入自己的闪卡
CREATE POLICY "Users can insert their own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_uuid
    OR user_uuid IS NULL
  );

-- 策略 3: 用户可以更新自己的闪卡
CREATE POLICY "Users can update their own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid()::text = user_uuid);

-- 策略 4: 用户可以删除自己的闪卡
CREATE POLICY "Users can delete their own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid()::text = user_uuid);
```

#### Step 5: 创建 TypeScript 类型定义

**文件**: `src/types/flashcard.d.ts`

```typescript
export interface Flashcard {
  id: number;
  uuid: string;
  user_uuid: string | null;
  file_id: string;

  question: string;
  answer: string;
  explanation: string | null;

  source: 'ai' | 'manual';
  order: number;

  views: number;
  mastery: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;

  is_favorited: boolean;
  tags: string | null;

  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface FlashcardCreateInput {
  file_id: string;
  question: string;
  answer: string;
  explanation?: string;
  order?: number;
  source?: 'ai' | 'manual';
}

export interface FlashcardUpdateInput {
  question?: string;
  answer?: string;
  explanation?: string;
  order?: number;
  is_favorited?: boolean;
  tags?: string;
}

export interface FlashcardReviewInput {
  quality: number;  // 0-5 (SM-2 算法)
}

export interface FlashcardListResponse {
  success: boolean;
  data?: {
    flashcards: Flashcard[];
    count: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface FlashcardResponse {
  success: boolean;
  data?: Flashcard;
  error?: string;
}
```

#### Step 6: 创建 API 路由

**6.1 保存闪卡 API**

**文件**: `src/app/api/workspace/flashcards/save/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flashcards } from '@/db/schema';
import { auth } from '@/auth';
import { randomUUID } from 'crypto';
import type { FlashcardCreateInput } from '@/types/flashcard.d';

/**
 * POST /api/workspace/flashcards/save
 * 批量保存闪卡到数据库
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取用户信息（可选，支持匿名用户）
    const session = await auth();
    const userUuid = session?.user?.uuid || null;

    // 2. 解析请求体
    const body = await request.json();
    const { fileId, flashcards: flashcardsData } = body;

    // 3. 验证必填字段
    if (!fileId || !flashcardsData || !Array.isArray(flashcardsData)) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, flashcards (array)' },
        { status: 400 }
      );
    }

    // 4. 准备数据
    const now = new Date();
    const expiresAt = userUuid ? null : new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h for anonymous

    const flashcardsToInsert = flashcardsData.map((card: FlashcardCreateInput, index: number) => ({
      uuid: randomUUID(),
      user_uuid: userUuid,
      file_id: fileId,
      question: card.question,
      answer: card.answer,
      explanation: card.explanation || null,
      source: card.source || 'ai',
      order: card.order !== undefined ? card.order : index,
      created_at: now,
      updated_at: now,
      expires_at: expiresAt,
    }));

    // 5. 批量插入数据库
    const result = await db()
      .insert(flashcards)
      .values(flashcardsToInsert)
      .returning();

    // 6. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Flashcards saved successfully',
      data: {
        flashcards: result,
        count: result.length,
        expiresAt: expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Save flashcards error:', error);
    return NextResponse.json(
      { error: 'Failed to save flashcards', details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**6.2 加载闪卡 API**

**文件**: `src/app/api/workspace/flashcards/load/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flashcards } from '@/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * GET /api/workspace/flashcards/load?fileId=xxx
 * 从数据库加载闪卡
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 获取查询参数
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing fileId parameter' },
        { status: 400 }
      );
    }

    // 2. 获取用户信息（可选）
    const session = await auth();
    const userUuid = session?.user?.uuid || null;

    // 3. 从数据库查询
    const result = await db()
      .select()
      .from(flashcards)
      .where(
        and(
          eq(flashcards.file_id, fileId),
          // 匿名用户：只查询未过期的数据
          userUuid
            ? eq(flashcards.user_uuid, userUuid)
            : or(
                isNull(flashcards.user_uuid),
                and(
                  isNull(flashcards.user_uuid),
                  or(
                    isNull(flashcards.expires_at),
                    gt(flashcards.expires_at, new Date())
                  )
                )
              )
        )
      )
      .orderBy(flashcards.order);

    // 4. 返回闪卡数据
    return NextResponse.json({
      success: true,
      data: {
        flashcards: result,
        count: result.length,
        hasFlashcards: result.length > 0,
      },
    });
  } catch (error) {
    console.error('Load flashcards error:', error);
    return NextResponse.json(
      { error: 'Failed to load flashcards', details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**6.3 更新闪卡 API**

**文件**: `src/app/api/workspace/flashcards/[uuid]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flashcards } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import type { FlashcardUpdateInput, FlashcardReviewInput } from '@/types/flashcard.d';

/**
 * PUT /api/workspace/flashcards/[uuid]
 * 更新闪卡内容
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    // 1. 获取用户信息
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 解析请求体
    const body: FlashcardUpdateInput = await request.json();

    // 3. 验证权限
    const existing = await db()
      .select()
      .from(flashcards)
      .where(eq(flashcards.uuid, uuid))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    if (existing[0].user_uuid !== userUuid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. 更新数据
    const result = await db()
      .update(flashcards)
      .set({
        ...body,
        updated_at: new Date(),
      })
      .where(eq(flashcards.uuid, uuid))
      .returning();

    // 5. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Flashcard updated successfully',
      data: result[0],
    });
  } catch (error) {
    console.error('Update flashcard error:', error);
    return NextResponse.json(
      { error: 'Failed to update flashcard', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspace/flashcards/[uuid]
 * 删除闪卡
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    // 1. 获取用户信息
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 验证权限
    const existing = await db()
      .select()
      .from(flashcards)
      .where(eq(flashcards.uuid, uuid))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    if (existing[0].user_uuid !== userUuid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 删除数据
    await db()
      .delete(flashcards)
      .where(eq(flashcards.uuid, uuid));

    // 4. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Flashcard deleted successfully',
    });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard', details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

**6.4 复习闪卡 API（SRS 算法）**

**文件**: `src/app/api/workspace/flashcards/[uuid]/review/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { flashcards } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import type { FlashcardReviewInput } from '@/types/flashcard.d';

/**
 * SM-2 算法计算下次复习时间
 * @param quality 0-5 (0=完全忘记, 5=完美记忆)
 * @param easeFactor 当前难度系数
 * @param interval 当前间隔（天）
 * @param repetitions 重复次数
 */
function calculateNextReview(
  quality: number,
  easeFactor: number,
  interval: number,
  repetitions: number
) {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // 回答正确
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions += 1;
  } else {
    // 回答错误，重置
    newRepetitions = 0;
    newInterval = 1;
  }

  // 更新难度系数
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // 计算下次复习时间
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

/**
 * POST /api/workspace/flashcards/[uuid]/review
 * 记录复习结果，更新 SRS 参数
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    // 1. 获取用户信息
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 解析请求体
    const body: FlashcardReviewInput = await request.json();
    const { quality } = body;

    if (quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: 'Quality must be between 0 and 5' },
        { status: 400 }
      );
    }

    // 3. 获取当前闪卡数据
    const existing = await db()
      .select()
      .from(flashcards)
      .where(eq(flashcards.uuid, uuid))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    if (existing[0].user_uuid !== userUuid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const card = existing[0];

    // 4. 计算新的 SRS 参数
    const { easeFactor, interval, repetitions, nextReviewAt } = calculateNextReview(
      quality,
      card.ease_factor,
      card.interval,
      card.repetitions
    );

    // 5. 更新数据库
    const result = await db()
      .update(flashcards)
      .set({
        views: card.views + 1,
        mastery: Math.min(100, Math.max(0, card.mastery + (quality >= 3 ? 10 : -20))),
        ease_factor: easeFactor,
        interval,
        repetitions,
        last_reviewed_at: new Date(),
        next_review_at: nextReviewAt,
        updated_at: new Date(),
      })
      .where(eq(flashcards.uuid, uuid))
      .returning();

    // 6. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Review recorded successfully',
      data: {
        flashcard: result[0],
        nextReview: {
          interval,
          nextReviewAt: nextReviewAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Review flashcard error:', error);
    return NextResponse.json(
      { error: 'Failed to record review', details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

#### Step 7: 更新前端组件

**文件**: `src/components/workspace/FlashcardsView.tsx`

在现有代码基础上添加保存/加载逻辑：

```typescript
// 在组件顶部添加
const [flashcardUuids, setFlashcardUuids] = useState<string[]>([]);
const [isSaved, setIsSaved] = useState(false);

// 修改 useEffect，添加加载逻辑
useEffect(() => {
  if (fileId) {
    loadFlashcards();
  }
}, [fileId]);

// 添加加载函数
const loadFlashcards = async () => {
  if (!fileId) return;

  try {
    const response = await fetch(`/api/workspace/flashcards/load?fileId=${fileId}`);
    if (!response.ok) {
      throw new Error('Failed to load flashcards');
    }

    const data = await response.json();
    if (data.success && data.data.hasFlashcards) {
      setFlashcards(data.data.flashcards);
      setFlashcardUuids(data.data.flashcards.map((card: any) => card.uuid));
      setIsGenerated(true);
      setIsSaved(true);
      console.log('Flashcards loaded:', data.data.count);
    }
  } catch (error) {
    console.error('Load flashcards error:', error);
    // 静默失败，不影响用户体验
  }
};

// 修改 generateFlashcards 函数，添加保存逻辑
const generateFlashcards = async () => {
  // ... 现有生成逻辑 ...

  // 生成成功后，保存到数据库
  if (fileId) {
    saveFlashcards(data.data.flashcards);
  }
};

// 添加保存函数
const saveFlashcards = async (flashcardsData: FlashcardData[]) => {
  if (!fileId) return;

  try {
    const response = await fetch('/api/workspace/flashcards/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId,
        flashcards: flashcardsData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save flashcards');
    }

    const data = await response.json();
    if (data.success) {
      setFlashcardUuids(data.data.flashcards.map((card: any) => card.uuid));
      setIsSaved(true);
      console.log('Flashcards saved:', data.data.count);
      toast.success('闪卡已保存');
    }
  } catch (error) {
    console.error('Save flashcards error:', error);
    toast.error('保存闪卡失败');
  }
};
```

---

**文档版本**: 1.0
**最后更新**: 2025-11-04
**作者**: AI Assistant
**状态**: 待审核

