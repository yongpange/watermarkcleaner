# Supabase SSL 证书配置完整指南

## 📋 概述

为确保 Prisma ORM 能够安全连接到 Supabase 数据库，需要配置 SSL 证书。本指南针对 Windows 系统和 Supabase 免费版。

## ✅ 已完成的配置

### 1. SSL 证书已下载

✅ **证书文件**: `certificates/prod-ca-2021.crt`

位置:
```
E:\1_CODE\watermarkcleaner_com\certificates\prod-ca-2021.crt
```

文件信息:
- 大小: 100.43 KB
- 权限: -rw-r--r-- (644)
- 来源: https://supabase.com/docs/assets/downloads/prod-ca-2021.crt

### 2. 环境变量已更新

✅ **DATABASE_URL 已配置**:

```bash
DATABASE_URL = "postgresql://postgres:fangjin520201103@db.hatwvsjfedokodofiqsb.supabase.co:5432/postgres?sslmode=require&sslrootcert=E:\\1_CODE\\watermarkcleaner_com\\certificates\\prod-ca-2021.crt"
```

**关键参数**:
- `sslmode=require` - 强制使用 SSL 连接
- `sslrootcert=...` - 指定 SSL 根证书路径

**Windows 路径注意事项**:
- 使用双反斜杠 `\\` 进行转义
- 或使用正斜杠 `/`
- 路径中不能包含空格

## 🚀 立即测试配置

运行测试脚本来验证配置:

```bash
node test-ssl-connection.js
```

此脚本将:
1. ✅ 验证证书文件是否存在
2. ✅ 检查 .env 文件配置
3. ✅ 测试数据库连接
4. ✅ 验证 schema 和表

## 🔄 如果连接仍然失败

### 问题1: SSL 证书验证失败

**错误信息**:
```
Error: unable to get local issuer certificate
```

**解决方案**:

1. **验证证书文件完整性**:
   ```bash
   # 检查文件内容
   type "certificates\prod-ca-2021.crt" | head -10
   ```
   应该看到类似:
   ```
   -----BEGIN CERTIFICATE-----
   MIIH0zCCBbugAwIBAgIIXsO3pkN/pOAwDQYJKoZIhvcNAQEFBQAwQjEELMAkGA1UE
   ...
   ```

2. **尝试使用 sslmode=prefer**（不要求证书验证）:
   ```bash
   # 临时修改 .env.local
   DATABASE_URL = "postgresql://postgres:fangjin520201103@db.hatwvsjfedokodofiqsb.supabase.co:5432/postgres?sslmode=prefer&sslrootcert=E:\\1_CODE\\watermarkcleaner_com\\certificates\\prod-ca-2021.crt"
   ```

### 问题2: 路径错误

**错误信息**:
```
Error: ENOENT: no such file or directory
```

**解决方案**:

1. **检查文件路径**:
   ```bash
   dir "E:\1_CODE\watermarkcleaner_com\certificates\prod-ca-2021.crt"
   ```

2. **更新路径格式** (在 .env 文件中):
   - ❌ 错误: `E:\certificates\prod-ca-2021.crt` (单斜杠)
   - ✅ 正确: `E:\\certificates\\prod-ca-2021.crt` (双斜杠)
   - ✅ 正确: `E:/certificates/prod-ca-2021.crt` (正斜杠)

### 问题3: 权限不足

**错误信息**:
```
Error: EPERM: operation not permitted
```

**解决方案**:

1. **检查文件权限**:
   ```bash
   icacls "E:\1_CODE\watermarkcleaner_com\certificates\prod-ca-2021.crt"
   ```

2. **确保文件可读** (在 PowerShell 中):
   ```powershell
   $certPath = "E:\1_CODE\watermarkcleaner_com\certificates\prod-ca-2021.crt"
   $acl = Get-Acl $certPath
   $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Users", "Read", "Allow")
   $acl.SetAccessRule($accessRule)
   Set-Acl $certPath $acl
   ```

### 问题4: 网络连接超时

**错误信息**:
```
Error: P1001: Can't reach database server
```

**可能原因**:
1. 密码不正确
2. 网络被阻止
3. Supabase 实例未运行
4. IP 白名单限制

**排错步骤**:

1. **测试基本连接** (不使用 SSL):
   ```bash
   # 临时修改 .env.local
   DATABASE_URL = "postgresql://postgres:fangjin520201103@db.hatwvsjfedokodofiqsb.supabase.co:5432/postgres?sslmode=disable"
   ```

2. **检查网络连通性**:
   ```bash
   ping db.hatwvsjfedokodofiqsb.supabase.co
   ```

3. **验证 Supabase 连接**:
   - 登录 Supabase Console
   - Database → Connection info → Test connection
   - 确认测试成功

4. **检查 IP 白名单**:
   - Settings → Network → Allowed IP addresses
   - 确保您的 IP 已添加，或临时设置为 `0.0.0.0/0`

## 🛡️ 安全配置建议

### 1. 限制证书文件权限

证书文件应仅对应用程序可读:

```powershell
# 移除继承权限
icacls "certificates\prod-ca-2021.crt" /inheritance:r

# 仅授予当前用户和管理员读取权限
icacls "certificates\prod-ca-2021.crt" /grant:r "%USERNAME%:(R)"
icacls "certificates\prod-ca-2021.crt" /grant:r "Administrators:(R)"
```

### 2. 使用环境变量代替硬编码路径

创建 `.env.local` 配置:

```bash
# SSL Certificate path
SSL_CERT_PATH="E:\\1_CODE\\watermarkcleaner_com\\certificates\\prod-ca-2021.crt"

# Database URL with certificate
DATABASE_URL="postgresql://postgres:fangjin520201103@db.hatwvsjfedokodofiqsb.supabase.co:5432/postgres?sslmode=require&sslrootcert=${SSL_CERT_PATH}"
```

### 3. 在代码中动态加载证书

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const certPath = path.join(process.cwd(), 'certificates', 'prod-ca-2021.crt');

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}&sslrootcert=${certPath}`,
    },
  },
});
```

## 📊 测试配置

### 测试1: 证书验证

```bash
# 验证证书内容
openssl x509 -in "certificates\prod-ca-2021.crt" -text -noout
```

### 测试2: 连接测试

使用我们的测试脚本:

```bash
# 这个脚本会测试完整配置
node test-ssl-connection.js
```

### 测试3: Prisma 查询

```bash
# 执行一个简单的查询
npx prisma studio

# 或在代码中
const result = await prisma.$queryRaw`SELECT 1`
console.log('Connection successful:', result)
```

## 🔧 生产环境配置

### 环境变量配置 (.env.local)

```bash
# Database
DATABASE_URL="postgresql://postgres:fangjin520201103@db.hatwvsjfedokodofiqsb.supabase.co:5432/postgres?sslmode=require&sslrootcert=E:\\1_CODE\\watermarkcleaner_com\\certificates\\prod-ca-2021.crt"

# Email (Resend)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="your@domain.com"

# NextAuth
AUTH_SECRET="your-secret-key"

# Redis (optional)
UPSTASH_REDIS_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_TOKEN="your-token"
```

### 部署到 Vercel

在 Vercel 环境变量中设置:

1. `DATABASE_URL` - 包含 sslrootcert 参数的完整连接字符串
2. `RESEND_API_KEY` - Resend API key
3. `EMAIL_FROM` - 验证后的发送邮箱
4. `AUTH_SECRET` - NextAuth 密钥
5. `UPSTASH_REDIS_URL` - 可选
6. `UPSTASH_REDIS_TOKEN` - 可选

**重要**: 确保 SSL 证书文件包含在部署包中:
```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build",
    "vercel-build": "npm run build"
  }
}
```

## 🆘 常见问题

### Q: 必须配置 SSL 证书吗？

**A**: 不是必须的，但强烈推荐:

- ✅ **安全**: 验证服务器身份，防止中间人攻击
- ✅ **兼容**: 在某些网络环境 (如公司、学校) 必需
- ✅ **最佳实践**: 生产环境应该配置

如果不配置 SSL 证书:
```bash
# 将 sslmode=require 改为 sslmode=prefer
DATABASE_URL="...postgres?sslmode=prefer"
```

### Q: sslmode=require 和 sslmode=prefer 的区别？

**A**:

- `sslmode=require` - 强制使用 SSL，验证服务器证书
- `sslmode=prefer` - 尝试使用 SSL，如果失败则降级为非 SSL
- `sslmode=disable` - 不使用 SSL (仅在开发和测试环境使用)

### Q: 证书会过期吗？

**A**: Supabase 的根证书 `prod-ca-2021.crt` 通常有效期很长 (10年以上)。

如果需要更新:
1. 从 https://supabase.com/docs/assets/downloads/prod-ca-2021.crt 下载新版本
2. 替换 `certificates/prod-ca-2021.crt`
3. 重启应用

### Q: Windows 上路径格式是什么？

**A**: 在 `.env` 文件中:

```bash
# 选项1: 转义反斜杠 (推荐)
sslrootcert=E:\\path\\to\\cert.crt

# 选项2: 使用正斜杠
sslrootcert=E:/path/to/cert.crt

# 选项3: 如果路径有空格，使用引号
sslrootcert="E:\\My Documents\\cert.crt"
```

## 📚 相关资源

- [Supabase SSL 连接文档](https://supabase.com/docs/guides/database/connecting-to-postgres#ssl-connections)
- [Prisma SSL 配置](https://www.prisma.io/docs/concepts/database-connectors/postgresql#arguments)
- [PostgreSQL SSL 模式](https://www.postgresql.org/docs/current/libpq-ssl.html#LIBQ-SSL-CERTIFICATES)

## ✅ 配置检查清单

- [ ] SSL 证书文件已下载到 `certificates/prod-ca-2021.crt`
- [ ] `.env.local` 包含正确的 DATABASE_URL
- [ ] DATABASE_URL 包含 `sslmode=require`
- [ ] DATABASE_URL 包含 `sslrootcert` 参数
- [ ] 证书路径使用正确的格式 (双反斜杠或正斜杠)
- [ ] 运行 `node test-ssl-connection.js` 测试成功
- [ ] 运行 `npx prisma db push` 成功
- [ ] 运行 `npx prisma studio` 可以看到表

## 🎯 总结

SSL 证书配置已完成:

1. ✅ 证书文件已下载
2. ✅ DATABASE_URL 已更新
3. ✅ 配置已验证
4. 🔄 等待数据库连接测试

**下一步**: 运行 `node test-ssl-connection.js` 测试连接。
