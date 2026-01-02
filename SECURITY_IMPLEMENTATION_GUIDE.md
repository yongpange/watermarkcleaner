# 安全记录系统实施指南

## 概述

本指南描述了如何安全地记录未登录用户的图片处理历史，同时保护用户隐私并遵守数据保护法规。

## 核心安全特性

### 🔐 1. IP地址匿名化

- **技术**: SHA-256 加盐哈希
- **存储**: 仅保存哈希值，永不存储原始IP
- **盐值**: 32字节随机盐（存储在服务器环境变量）

### 🔒 2. 服务端专用API

- **端点**: `/api/record-processing`
- **认证**: 服务端专用密钥（Service Role Key）
- **安全**: 密钥不暴露给客户端代码

### 🧹 3. 数据自动清理

- **保留期**: 72小时（3天）
- **清理频率**: 每24小时自动执行
- **方式**: 自动删除过期记录

### 🛡️ 4. 访问控制

- **Origin验证**: 仅接受来自授权域名的请求
- **Admin API**: 需要Bearer Token认证
- **请求验证**: 参数验证和错误处理

## 实施步骤

### 步骤 1: 配置环境变量

在 `.env.local` 中添加：

```env
# IP哈希盐值（生成一次，不要修改）
# 生成命令: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
IP_HASH_SALT="your-64-char-hex-salt-here"

# Admin API密钥（至少32位的随机字符串）
ADMIN_API_KEY="your-secret-admin-key-here"

# 数据保留天数（默认3天）
DATA_RETENTION_DAYS="3"
```

### 步骤 2: 初始化数据库

在 Supabase 控制台执行：

```sql
-- 启用 RLS
ALTER TABLE public.wmc_processing_history ENABLE ROW LEVEL SECURITY;

-- 创建索引提高查询性能
CREATE INDEX idx_processing_history_ip_date
ON public.wmc_processing_history(ip_address, created_at)
WHERE success = true;

CREATE INDEX idx_processing_history_user_date
ON public.wmc_processing_history(user_id, created_at)
WHERE success = true;
```

### 步骤 3: 启动应用

启动开发服务器：

```bash
npm run dev
```

应用启动时会自动初始化安全服务，包括：
- 启动自动清理调度器（每24小时运行一次）
- 打印初始化日志

### 步骤 4: 测试完整流程

#### 测试1: 记录处理历史

以未登录用户身份上传图片进行处理，验证：

1. **数据库记录**:
   ```sql
   SELECT * FROM wmc_processing_history
   WHERE ip_address IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **IP已哈希**: 确认 `ip_address` 列是SHA-256哈希值（64字符十六进制），不是原始IP

3. **Credits显示更新**: 前端应显示已使用的额度（如：1/3）

#### 测试2: 验证IP哈希

```bash
# 测试API端点（需要重启服务器以应用更改）
curl -X POST http://localhost:3001/api/record-processing \
  -H "Content-Type: application/json" \
  -d '{"imageSize": 1024000, "success": true}'
```

检查数据库中存储的IP哈希值。

#### 测试3: 手动触发数据清理

```bash
# 获取统计数据（替换your-admin-key）
curl -X POST http://localhost:3001/api/admin/cleanup \
  -H "Authorization: Bearer your-admin-key"

# 执行清理
curl -X GET "http://localhost:3001/api/admin/cleanup?days=3" \
  -H "Authorization: Bearer your-admin-key"
```

### 步骤 5: 验证自动清理

等待24小时或修改代码中的间隔时间进行测试：

```typescript
// In src/lib/security/cleanup.ts
const CLEANUP_INTERVAL = 60 * 1000; // 改为1分钟用于测试
```

检查日志输出确认清理任务执行。

## 代码结构

```
src/
├── app/
│   ├── api/
│   │   ├── record-processing/    # 记录处理历史API
│   │   └── admin/
│   │       └── cleanup/          # 管理清理API
│   └── middleware.ts             # 初始化安全服务
├── lib/
│   └── security/
│       ├── ip-hash.ts            # IP哈希工具
│       ├── cleanup.ts            # 数据清理服务
│       └── initialize.ts         # 初始化逻辑
└── scripts/
    └── test-security.js          # 测试脚本
```

## API参考

### POST /api/record-processing

记录图片处理历史。

**请求体:**
```json
{
  "imageSize": 1024000,    // 必需：图片大小（字节）
  "userId": "uuid",         // 可选：已登录用户ID
  "success": true           // 可选：是否成功，默认true
}
```

**响应:**
```json
{
  "success": true,
  "message": "Processing history recorded successfully"
}
```

### POST /api/admin/cleanup

获取清理统计信息（需要Admin Key）。

**Headers:**
```
Authorization: Bearer <ADMIN_API_KEY>
```

**响应:**
```json
{
  "success": true,
  "totalRecords": 100,
  "recordsOlderThan72Hours": 25,
  "nextCleanup": "2024-01-05T12:00:00.000Z"
}
```

### GET /api/admin/cleanup?days=3

手动触发数据清理（需要Admin Key）。

**Headers:**
```
Authorization: Bearer <ADMIN_API_KEY>
```

**参数:**
- `days`: 保留最近多少天的数据（默认3天）

**响应:**
```json
{
  "success": true,
  "deletedCount": 25,
  "cutoffDate": "2024-01-02T12:00:00.000Z"
}
```

## 隐私合规

### GDPR合规

1. **合法依据**: 合法利益（防止服务滥用）
2. **数据最小化**: 仅收集必要信息（IP哈希、图片大小）
3. **存储期限**: 明确限制（72小时）
4. **安全措施**: 匿名化处理、加密存储

### CCPA合规

1. **不销售个人信息**: IP哈希不属于可识别个人信息
2. **删除权**: 提供删除机制（Admin API）
3. **透明度**: 明确的隐私政策

### 隐私政策建议

在隐私政策中添加：

```markdown
### 图片处理记录

当未登录用户使用我们的图片处理服务时，我们会记录以下信息以防止服务滥用：

- **匿名化IP地址**: 您的IP地址会使用SHA-256算法加盐哈希处理，
  原始IP地址不会被存储。哈希值用于跟踪月度使用限额。

- **图片大小**: 处理的图片文件大小（字节），用于统计分析。

- **处理时间**: 记录创建时间戳。

**数据保留**: 这些记录将在72小时后自动删除。

**法律依据**: 我们通过匿名化处理您的IP地址来维护服务的
  安全性和公平性使用，基于我们的合法利益（GDPR第6(1)(f)条）。
```

## 监控和日志

### 日志示例

应用启动时：
```
🔒 Initializing security services...
✅ Security services initialized successfully
✅ Auto cleanup scheduler started. Will run every 24 hours.
```

记录处理历史时：
```
Processing history recorded successfully
```

执行清理时：
```
Starting scheduled cleanup...
✅ Cleanup completed. Deleted 45 old records.
```

### 错误处理

系统包含完整的错误处理：
- 数据库操作失败记录错误日志但不阻塞用户
- API调用失败不影响主流程
- 清理失败会记录错误并继续运行

## 安全最佳实践

### 1. 保护Admin Key

- 使用至少32位的随机字符串
- 定期轮换
- 不在日志或错误信息中暴露
- 仅限授权人员访问

### 2. 监控和告警

建议设置监控：
- 异常的API调用频率
- 清理任务失败
- 数据库错误率

### 3. 定期安全审计

- 审查访问日志
- 验证数据清理效果
- 检查环境变量安全

## 故障排除

### 问题1: 记录未写入数据库

**症状**: 处理后 `wmc_processing_history` 表为空

**检查**:
1. 查看控制台日志是否有错误
2. 检查 `/api/record-processing` 响应
3. 验证 Service Role Key 配置
4. 检查数据库表是否存在

### 问题2: Credits显示未更新

**症状**: 界面显示 0/3，不随使用增加

**检查**:
1. 确认记录已写入数据库
2. 检查 `/api/credits/check-ip` 返回的数据
3. 验证前端是否正确获取并显示数据

### 问题3: 自动清理未执行

**症状**: 72小时后的记录仍然存在

**检查**:
1. 查看启动日志确认清理服务已初始化
2. 验证 `cleanupProcessingHistory` 函数正常工作
3. 手动运行 `npm run cleanup` 测试

## 性能优化

### 数据库索引

确保以下索引已创建：

```sql
-- IP地址和日期范围查询
CREATE INDEX idx_processing_history_ip_date
ON public.wmc_processing_history(ip_address, created_at)
WHERE success = true;

-- 用户ID和日期范围查询
CREATE INDEX idx_processing_history_user_date
ON public.wmc_processing_history(user_id, created_at)
WHERE success = true;

-- 清理操作优化
CREATE INDEX idx_processing_history_created_at
ON public.wmc_processing_history(created_at);
```

### 缓存策略

IP哈希缓存：
- 使用LRU策略限制内存使用
- 最大缓存条目：10,000个
- 自动删除最老的条目

## 延伸阅读

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [IP Address Anonymization Best Practices](https://www.futureofprivacy.org/considerations-for-ip-addresses-and-the-gdpr-compliance/)
- [Next.js API Routes Security](https://nextjs.org/docs/api-routes/security)

## 更新日志

**2026-01-02**:
- 初始实现安全记录系统
- 添加IP哈希匿名化
- 实现数据自动清理
- 创建专用服务端API端点
