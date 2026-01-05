# IPv6/IPv4 本地主机问题导致的额度不更新

## 🔍 根本原因

你已经发现了问题！日志显示：

```
[Credits API] Raw IP: "::1"
```

**`::1` 是 IPv6 版本的 localhost**，而之前数据库中的记录可能来自 IPv4 的 `127.0.0.1`。

它们的哈希值完全不同：
- `127.0.0.1` → `a826ce17df04bd6d233c1acd1cfdd5ec92a8335d8dc0b6745f3011852d97798c`
- `::1` → `f1dd3fc54b561c0c610b3640664fa0679e985602fd3b840384dd57e1ef1cfbe8`

系统认为这是**两个不同的用户**，所以你的额度一直是新的！

---

## ✅ 解决方案

### 方案 A：使用 IPv4 地址访问（推荐）

访问这个 URL：
```
http://127.0.0.1:3000/convert
```

**不要使用：**
- ❌ `http://localhost:3000/convert`  （可能被解析为 ::1）
- ❌ `http://[::1]:3000/convert`      （明确使用 IPv6）

### 方案 B：运行诊断脚本

```bash
cd e:/1_CODE/watermarkcleaner_com
node scripts\diagnose-ip-issue.js
```

这个脚本会：
1. 显示不同 localhost 的哈希值
2. 查询数据库中所有 localhost 记录
3. 告诉你使用了哪些 IP 变体
4. 推荐最佳解决方案

### 方案 C：代码标准化（长期解决方案）

修改 `src/lib/security/ip-hash.ts`，标准化 localhost：

```typescript
export function getClientIP(request: Request): string {
  const headers = request.headers;

  // 按优先级获取真实IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // 标准化 localhost（关键修改！）
  return '127.0.0.1';  // 强制使用 IPv4 的 localhost
}
```

这样无论访问 `localhost` 还是 `::1`，都会被记录为 `127.0.0.1`。

---

## 🎯 立即操作

### 步骤 1：访问正确的 URL

在浏览器访问：
```
http://127.0.0.1:3000/convert
```

### 步骤 2：检查日志

在终端日志中，你应该看到：
```
[Credits API] Raw IP: "127.0.0.1"  // 不是 ::1
[Credits API] Hashed IP: "a826ce17df04bd6d233c1acd1cfdd5ec92a8335d8dc0b6745f3011852d97798c"
```

### 步骤 3：处理图片并验证

处理一张图片，然后刷新页面。

**期望结果：**
- 第一次：`Monthly usage: 1 / 3 images`
- 第二次：`Monthly usage: 2 / 3 images`
- 第三次：`Monthly usage: 3 / 3 images`

### 步骤 4：运行诊断脚本（验证）

```bash
cd e:/1_CODE/watermarkcleaner_com
node scripts\diagnose-ip-issue.js
```

输出会显示你使用的所有 IP 类型。

---

## 📊 验证数据库

在 Supabase SQL Editor 运行：

```sql
-- 查询所有 localhost 变体的记录
WITH localhost_hashes AS (
  VALUES
    ('127.0.0.1'),
    ('::1'),
    ('0:0:0:0:0:0:0:1'),
    ('localhost')
),
hashed AS (
  SELECT *,
    encode(sha256('1f8b83c74037ae6b2d473c1f2ffd4d070a0f335431c938216a71fec88e68dcd3'::bytea ||
                   ip::bytea), 'hex') as ip_hash
  FROM localhost_hashes
)
SELECT
  h.ip as original_ip,
  h.ip_hash,
  COUNT(p.id) as usage_count,
  MIN(p.created_at) as first_use,
  MAX(p.created_at) as last_use
FROM hashed h
LEFT JOIN wmc_processing_history p
  ON p.ip_address = h.ip_hash
WHERE p.created_at >= date_trunc('month', CURRENT_DATE)
  AND p.success = true
GROUP BY h.ip, h.ip_hash
ORDER BY usage_count DESC;
```

这个查询会显示所有 localhost 变体的使用情况。

---

## 💡 快速测试

### 测试 A：使用 IPv4

访问：http://127.0.0.1:3000/convert

预期：额度正确更新

### 测试 B：使用 IPv6

访问：http://[::1]:3000/convert

预期：新用户（额度重置为 0/3）

### 测试 C：使用 hostname

访问：http://localhost:3000/convert

预期：不确定（可能解析为 IPv4 或 IPv6）

---

## 🚀 推荐开发配置

修改你的开发脚本，强制使用 IPv4：

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev -H 127.0.0.1",  // 强制监听 IPv4
    "dev6": "next dev -H ::1"         // 可选：IPv6 测试
  }
}
```

然后使用：
```bash
npm run dev
```

而不是访问 `localhost`，直接访问：
```
http://127.0.0.1:3000
```

---

## 📋 总结

| 访问地址 | IP 地址 | 哈希值 | 是否共享额度 |
|---------|---------|--------|-------------|
| 127.0.0.1 | 127.0.0.1 | a826ce17... | ✅ 是 |
| localhost | ::1 (IPv6) | f1dd3fc5... | ❌ 否 |
| localhost | 127.0.0.1 (IPv4) | a826ce17... | ✅ 是 |
| [::1] | ::1 | f1dd3fc5... | ❌ 否 |

**核心结论：**
- 始终使用 `127.0.0.1` 进行本地开发
- 避免使用 `localhost`（可能解析为 IPv6）
- 部署到生产环境后，使用真实 IP 地址（没有这个问题）

---

## 🎬 现在操作

### 立即执行：

1. **停止服务器**：Ctrl+C
2. **修改访问地址**：访问 `http://127.0.0.1:3000/convert`
3. **重启服务器**：`npm run dev`
4. **刷新页面**：查看额度显示
5. **处理图片**：观察额度是否更新

### 验证结果：

```bash
# 在新终端运行
cd e:/1_CODE/watermarkcleaner_com
node scripts\diagnose-ip-issue.js
```

如果所有 localhost 记录都显示为 `127.0.0.1` 类型，说明修复成功！

---

还有其他问题吗？或者你想我帮你修改代码，自动标准化 localhost 地址？
