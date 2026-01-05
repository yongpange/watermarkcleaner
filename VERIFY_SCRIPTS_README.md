# 🔍 IP 哈希验证脚本使用指南

## 📋 快速开始

### 方法 1：双击运行（最简单）

**Windows 用户：**
1. 找到文件 `verify-ip-hashing.bat`
2. **双击**运行

**或者使用 PowerShell：**
1. 找到文件 `verify-ip-hashing.ps1`
2. 右键 → "使用 PowerShell 运行"

### 方法 2：命令行运行

**使用 CMD（命令提示符）：**
```bash
cd e:\1_CODE\watermarkcleaner_com
verify-ip-hashing.bat
```

**使用 PowerShell：**
```powershell
cd e:\1_CODE\watermarkcleaner_com
.\verify-ip-hashing.ps1
```

**使用 Node.js 直接运行：**
```bash
cd e:\1_CODE\watermarkcleaner_com
node scripts\verify-ip-hashing.js
```

## 🔍 这个脚本做什么？

验证脚本会检查以下内容：

### ✅ 1. 环境变量检查
- IP_HASH_SALT 是否存在
- 格式是否正确（64字符十六进制）
- 长度是否匹配

**期望输出：**
```
IP_HASH_SALT present: true
IP_HASH_SALT value: 1f8b83c74037ae6b2d473c1f2ffd4d070a0f335431c938216a71fec88e68dcd3
IP_HASH_SALT length: 64 chars (expected: 64)
```

### ✅ 2. IP 哈希一致性测试
对同一个 IP 进行多次哈希，验证结果是否一致。

**测试的 IP：**
- 127.0.0.1 (本地回环地址)
- 192.168.1.1 (常见内网地址)
- 8.8.8.8 (Google DNS)

**期望输出：**
```
IP: 127.0.0.1
  Hash 1: 18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de
  Hash 2: 18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de
  Hash 3: 18849ddcfb4ac7c006228118ee75b12cea0f541bb8dea1b2977a8d82f89705de
  Consistent: ✅ YES
```

**如果显示 ❌ NO：**
说明 IP_HASH_SALT 在变化，需要检查：
- `.env.local` 文件是否正确配置
- 是否有脚本覆盖 `process.env.IP_HASH_SALT`
- 是否同时存在 `.env` 和 `.env.local` 冲突

### ✅ 3. 数据库连接和记录检查
连接到 Supabase 数据库，查询最近的处理记录。

**期望输出：**
```
Found 5 recent records:

Record 1:
  ID: abc123...
  User ID: NULL (guest)
  IP Hash: 18849ddcfb4ac7c006228118ee75b12cea0f541...
  Image Size: 1024.50 KB
  Success: true
  Created: 2026/1/4 10:30:45

Total guest records (IP-based): 3
```

**如果没有记录：**
```
No records found in wmc_processing_history table.
```
这是正常的，如果你还没有处理过任何图片。

### ✅ 4. 总结报告

**全部通过：**
```
✅ IP_HASH_SALT is configured
✅ Hashing is consistent
✅ All tests passed!
```

**有错误：**
```
❌ IP_HASH_SALT not found!
    Add this to your .env.local file:
    IP_HASH_SALT="..."
```

## 🐛 常见问题

### ❌ 问题 1："'node' is not recognized..."

**错误信息：**
```
❌ Error: Node.js is not installed or not in PATH
```

**解决方法：**
1. 访问 https://nodejs.org/
2. 下载并安装 LTS 版本
3. 重新打开命令行或重启电脑
4. 再次运行脚本

### ❌ 问题 2："Database connection error"

**错误信息：**
```
❌ Error querying database: Unable to fetch
```

**可能原因：**
1. Supabase URL 或 Key 错误
2. 网络连接问题
3. Supabase 服务暂时不可用

**解决方法：**
检查 `.env.local` 文件中的配置：
```bash
NEXT_PUBLIC_SUPABASE_URL="https://hatwvsjfedokodofiqsb.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc...（你的key）"
```

### ❌ 问题 3："IP_HASH_SALT not found!"

**错误信息：**
```
❌ IP_HASH_SALT not found!
   Add this to your .env.local file:
   IP_HASH_SALT="..."
```

**解决方法：**
检查 `.env.local` 文件第51行：
```bash
IP_HASH_SALT="1f8b83c74037ae6b2d473c1f2ffd4d070a0f335431c938216a71fec88e68dcd3"
```

### ❌ 问题 4："Inconsistent hashes"

**错误信息：**
```
❌ ERROR: Hashes should be identical!
```

**这是个严重问题！** 说明 IP_HASH_SALT 在变化。

**可能原因：**
1. `scripts/ip-hash-test.js` 覆盖了环境变量
2. 多个 `.env` 文件冲突（.env, .env.local, .env.production）
3. 代码中某处修改了 `process.env.IP_HASH_SALT`

**解决方法：**
1. 删除或重命名 `scripts/ip-hash-test.js`
2. 确保只有 `.env.local` 文件存在
3. 重启电脑（清除所有缓存）
4. 再次运行验证脚本

## 📊 解读测试结果

### 场景 1：第一次运行（没有数据库记录）

```
No records found in wmc_processing_history table.
...
✅ All tests passed!
```

**状态：** ✅ 正常
**说明：** 你还没有处理过任何图片，所以数据库是空的。

**下一步：**
1. 启动 Next.js 开发服务器
2. 访问 `/convert` 页面
3. 上传并处理一张图片
4. 再次运行此脚本

### 场景 2：有数据库记录，额度为 0

```
Found 3 recent records:
...
Total guest records (IP-based): 3
...
Monthly usage: 0 / 3 images
Remaining: 3 images
```

**状态：** ❌ 异常
**说明：** 数据库有记录，但额度显示不正确。

**可能原因：**
- 额度查询使用的 IP 哈希与存储时不一致
- 时区问题导致查询范围错误
- 数据库索引问题

**下一步：**
查看 `IP_HASH_DEBUGGING_GUIDE.md` 中的调试步骤。

### 场景 3：一切正常

```
Found 3 recent records:
...
Total guest records (IP-based): 3
...
✅ All tests passed!
```

**状态：** ✅ 完美
**说明：** IP 哈希配置正确，数据库连接正常。

**下一步：**
1. 运行 Next.js 开发服务器
2. 测试完整的图片处理流程
3. 验证额度是否正确更新

## 🔄 定期验证

建议在以下情况运行此脚本：

- ✅ 修改了 `.env.local` 文件后
- ✅ 添加了新的环境变量后
- ✅ 遇到额度不更新的问题时
- ✅ 部署到生产环境前
- ✅ 每周定期检查

## 📞 需要帮助？

如果验证失败或有其他问题：

1. **查看详细日志**：检查 `IP_HASH_DEBUGGING_GUIDE.md`
2. **检查配置文件**：确保 `.env.local` 正确配置
3. **查看数据库**：登录 Supabase 控制台检查记录
4. **提供日志**：运行脚本并复制完整输出，发送给支持团队

## 🎯 快速诊断清单

运行脚本后，检查以下项目：

- [ ] IP_HASH_SALT present: true
- [ ] IP_HASH_SALT length: 64 chars
- [ ] Consistent: ✅ YES (for all test IPs)
- [ ] Database connection successful
- [ ] All tests passed!

如果所有项目都是 ✅，说明配置正确，问题可能在其他地方。

## 📚 相关文档

- `IP_HASH_DEBUGGING_GUIDE.md` - 完整的调试指南
- `scripts/verify-ip-hashing.js` - 验证脚本源代码
- `CLAUDE.md` - 项目架构文档
