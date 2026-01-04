# Mock API 测试指南

## 🚀 快速开始

### Step 1: 确认配置已到位（已完成）✅

我已为你完成以下配置：

1. ✅ **创建了 Mock API 路由**
   - 文件: `src/app/api/mock-seededit/route.ts`
   - 功能: 模拟真实的 ByteDance Ark API
   - 返回: 原图 + 模拟元数据

2. ✅ **修改了水印编辑器**
   - 文件: `src/components/watermark-editor/index.tsx`
   - 修改: 添加 Mock 模式切换逻辑
   - 位置: 第 31-34 行（API 端点配置）

3. ✅ **配置了环境变量**
   - 文件: `.env.local`
   - 添加: `NEXT_PUBLIC_USE_MOCK_API=true`
   - 位置: 文件末尾（第 19-23 行）

---

## 🧪 测试额度用尽流程（零成本）

### 测试场景 1: 已验证用户使用 10 张额度

**目标**: 验证完整的使用 10 张额度流程，以及第 11 张被阻止

**步骤**:

1. **启动开发服务器**
```bash
npm run dev
```

2. **打开浏览器控制台**
- 按 F12 打开开发者工具
- 切换到 Console 标签页
- 这将显示详细的日志信息

3. **登录/注册测试账号**
- 打开 http://localhost:3000
- 点击登录/注册（使用邮箱验证码）
- 新注册用户自动获得 10 张额度

4. **处理第 1-9 张图片**（都应该成功）
```
- 上传任意图片
- 点击"智能去除水印"
- 查看控制台日志:
  ✅ [Credits] Deduct success. User <id> now has 1 used credits.
  ✅ [Credits] Deduct success. User <id> now has 2 used credits.
  ...
  ✅ [Credits] Deduct success. User <id> now has 9 used credits.
```

5. **检查额度显示**
- Header 显示: "用户名 (9/10)"
- CreditsDisplay 显示: "已验证用户 - 9/10"

6. **处理第 10 张图片**（应该成功，但显示剩 0 张）
```
- 上传图片并处理
- 控制台日志:
  ✅ [Credits] Deduct success. User <id> now has 10 used credits.
- 额度显示更新为: "10/10"
```

7. **处理第 11 张图片**（应该被阻止）
```
- 上传图片并点击处理
- 预期结果:
  ❌ API 返回 403 错误
  ❌ Toast 提示: "额度已用完"
  ❌ 显示详细信息: "您本月已使用 10 / 10 张额度"
  ❌ 显示升级按钮: "升级到专业版获得无限额度 →"
  ❌ 点击按钮跳转到 /pricing
```

### 测试场景 2: 未验证用户使用 3 张额度

**目标**: 验证未验证用户的使用限制

**步骤**:

1. **使用未验证账号登录**
- 新注册的邮箱但未验证，或现有的未验证用户

2. **处理第 1-2 张图片**（成功）
```
- 额度显示: "1/3", "2/3"
- 显示升级提示: "验证邮箱可获得10张/月额度 →"
```

3. **处理第 3 张图片**（可能成功，取决于实现）
```
- 某些实现允许第3张
- 某些实现阻止第3张
```

4. **处理第 4 张图片**（应该被阻止）
```
- API 返回 403
- Toast 提示: "额度已用完"
- 升级按钮: "验证邮箱可获得10张/月额度 →"
- 点击跳转到 /auth/signin
```

---

## 🔍 验证功能清单

### Mock API 验证
- [ ] 上传图片后显示"处理成功"
- [ ] 控制台显示 `[Mock API] API mode: MOCK`
- [ ] 控制台显示处理延迟（如"processing_time: 1250ms"）
- [ ] 不消耗实际的 API 额度

### 额度检查
- [ ] 每次处理后额度正确增加
- [ ] CreditsDisplay 实时更新
- [ ] Header 显示同步更新
- [ ] `/api/credits/check` 返回正确数据

### 额度用尽阻止
- [ ] 用完额度后显示错误提示
- [ ] 错误信息包含具体使用量（"10/10"）
- [ ] 显示适当的升级建议
- [ ] 升级链接正确跳转到对应页面

### 数据库记录
- [ ] `wmc_processing_history` 表有记录
- [ ] `wmc_users.creditsused` 正确更新
- [ ] IP 哈希记录正确（未登录用户）

---

## 📊 Mock API 工作原理

### 请求流程

```
用户上传图片
    ↓
WatermarkEditor 检测 USE_MOCK_API=true
    ↓
调用 /api/mock-seededit (而不是 /api/seededit)
    ↓
Mock API 返回:
  - 模拟的 id
  - 原图 URL
  - 处理时间（200-2000ms 随机）
  - is_mock: true
    ↓
前端显示"处理成功"
    ↓
deductCredits() (真实扣除额度！)
```

**重要**: Mock API 只绕过 AI 处理，**不绕过额度扣除**。
这意味着你可以完整测试额度管理系统，而不消耗昂贵的 AI API 调用。

---

## 🛠️ 自动化测试脚本

我为你创建了一个自动化测试脚本：

```bash
# 测试 Mock API 路由是否正常工作
node scripts/test-mock-api.js
```

**预期输出**:
```
🚀 测试 Mock API
================================================================================

1. 测试 Mock API 端点

   - 创建测试图片...

   ✅ 测试图片创建成功: E:\1_CODE\watermarkcleaner_com\outputs\test-image.png

   - 准备发送 POST 请求到 /api/mock-seededit

   - 图片大小: 95 bytes

   📝 发送请求...

   📡 收到响应:

   - 状态码: 200 OK

   - Content-Type: application/json

   ✅ 响应数据:

    {
      "success": true,
      "data": {
        "id": "mock-12345",
        "url": "/api/mock-seededit/result?id=mock-12345",
        "size": 95,
        "mode": "auto",
        "is_mock": true,
        "processing_time": 1250
      }
    }

   🎉 Mock API 工作正常！

   - 图片 URL: /api/mock-seededit/result?id=mock-12345
   - 是否为 Mock: true
   - 处理模式: auto
   - 处理时间: 1250 ms

================================================================================

✅ 所有测试通过！

接下来可以:
1. 启动开发服务器: npm run dev
2. 打开浏览器: http://localhost:3000
3. 上传图片并测试处理
4. 验证额度是否正确扣除
```

**使用该脚本的前提**:
- 开发服务器正在运行（`npm run dev`）
- 应用已正确启动

---

## 🎯 额度用尽测试的三种方法

### 方法 1: 手动测试（推荐）

**步骤**:
1. 注册新账号（获得 10 张额度）
2. 手动处理 10 张图片
3. 第 11 张验证阻止逻辑

**优点**: 最真实的用户体验
**缺点**: 耗时（但零成本）

### 方法 2: 数据库直接修改（快速）

**步骤**:
```sql
-- 1. 直接修改数据库（使用 Supabase Studio）
UPDATE wmc_users
SET creditsused = 9
WHERE email = 'your-test-email@example.com';

-- 2. 登录并处理 1 张图片（到 10）
-- 3. 再处理 1 张图片（应该被阻止）
```

**优点**: 快速测试最后几张
**缺点**: 需要数据库访问

### 方法 3: 自动化脚本（最快）

```typescript
// 创建测试脚本
// scripts/test-exhaustion-manual.ts

async function testExhaustion() {
  const userId = await createTestUser('verified', 0);

  // 快速使用 10 张额度
  for (let i = 0; i < 10; i++) {
    await deductCredits(userId); // 直接调用，不处理图片
  }

  // 现在测试第 11 张
  const credits = await checkCredits(userId);
  console.log('Remaining:', credits.remaining); // 应该是 0
}
```

---

## ⚠️ 注意事项

### 重要提醒

1. **Mock API 不消耗成本，但会真实扣除额度**
   - 每次调用 `deductCredits()` 都会真实写入数据库
   - 这是有意设计的，以便测试额度管理系统

2. **额度重置**
   - 月度额度在每月 1 日重置
   - 测试用户可以在测试后手动重置：`creditsused = 0`

3. **测试后清理**
   - 建议创建专用测试账号
   - 定期清理测试产生的数据

4. **关闭 Mock 模式**
   - 移除或注释掉 `.env.local` 中的 `NEXT_PUBLIC_USE_MOCK_API=true`
   - 重启开发服务器

### 常见问题

**Q: 为什么额度还在减少？**
A: Mock 只绕过 AI API，不绕过额度系统。这是有意设计的。

**Q: 如何快速恢复额度？**
```sql
-- 在 Supabase 控制台执行
UPDATE wmc_users SET creditsused = 0 WHERE email = 'your-test-email@example.com';
```

**Q: Mock API 返回的是原图吗？**
A: 是的，返回的是 1x1 透明像素图（最小化数据传输）。

**Q: 如何确认正在使用 Mock？**
A: 查看浏览器控制台：`[WatermarkEditor] API mode: MOCK`

---

## 📚 相关文件

### 核心文件
- `src/app/api/mock-seededit/route.ts` - Mock API 实现
- `src/components/watermark-editor/index.tsx` - 编辑器组件（已配置 Mock 模式）
- `.env.local` - 环境变量配置

### 测试文件
- `scripts/test-mock-api.js` - Mock API 自动化测试
- `LOCAL_TESTING_GUIDE.md` - 完整测试指南

### 额度管理
- `src/lib/credits/check.ts` - 额度检查逻辑
- `src/components/CreditsDisplay.tsx` - 额度显示组件
- `src/components/blocks/header/index.tsx` - Header 额度显示

---

## ✅ 验证清单

在发送代码给你之前，我已验证：

- [x] Mock API 路由文件已创建
- [x] 水印编辑器已配置 Mock 模式
- [x] 环境变量已添加
- [x] 所有代码修改已完成
- [x] 测试脚本已创建
- [x] 文档已准备

---

**文档版本**: 1.0
**最后更新**: 2026-01-03
**状态**: ✅ 已完成（可直接使用）

现在你可以开始测试了！🎉

**下一步**: 运行 `npm run dev` 并开始测试额度用尽流程
