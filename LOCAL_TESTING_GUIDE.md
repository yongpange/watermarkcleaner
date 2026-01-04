# 本地测试成本优化指南

## 额度用完提示分析

### 当前提示机制

**文件**: `src/app/api/seededit/route.ts` (第 153-165 行)

```typescript
if (credits.remaining <= 0) {
  return NextResponse.json(
    {
      error: "额度已用完",
      details: `您本月已使用 ${credits.used} / ${tierConfig.maxPerMonth} 张额度`,
      action: credits.tier === "unverified"
        ? "验证邮箱可获得10张/月额度 →"
        : "升级到专业版获得无限额度 →",
      upgradeUrl: credits.tier === "unverified" ? "/auth/signin" : "/pricing",
    },
    { status: 403 }
  );
}
```

**前端显示**:

```typescript
// 应该在 WatermarkEditor 中有错误处理
.then(data => {
  if (!data.success) {
    toast.error(data.error || "处理失败");
    // 显示详细的额度使用信息和升级建议
  }
})
```

### 完整的额度用尽流程

1. **第一阶段的警告**（剩余 5 张时）
   - 显示升级提示
   - CreditsDisplay 第 179 行：`credits.remaining <= 5`

2. **最终阻止**（剩余 0 张时）
   - API 返回 403 错误
   - 显示具体使用量（例如："您本月已使用 10 / 10 张额度"）
   - 提供升级路径链接

3. **用户操作**
   - 未验证用户：跳转到登录/验证页面
   - 已验证用户：跳转到定价页面

---

## 本地测试策略（成本优化）

### 问题分析

**测试痛点**:
- 每次调用 ByteDance Ark API 成本高昂
- 生产环境 API 密钥不宜在本地大量测试
- 无法真实模拟额度用完场景
- 频繁测试会快速消耗 10 张验证额度

**测试需求**:
- 验证额度检查逻辑
- 测试额度用尽提示
- 测试升级引导流程
- 不影响生产额度

---

## 方案一：Mock API（推荐）

### 1.1 创建 Mock API 路由

```typescript
// src/app/api/mock-seededit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock API 用于测试额度用尽场景
 * 完全模拟真实 API 的输入输出，但不调用真实的 AI 服务
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const mode = formData.get('mode') as string;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 模拟处理延迟（200ms - 2s 随机）
    const delay = Math.random() * 1800 + 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 读取图片基本信息（不实际处理）
    const buffer = Buffer.from(await image.arrayBuffer());
    const size = buffer.length;

    // 生成模拟的处理结果
    // 实际上只是返回原图或轻微修改
    const mockResultId = uuidv4();

    return NextResponse.json({
      success: true,
      data: {
        id: mockResultId,
        url: `/api/mock-result/${mockResultId}`, // 指向另一个 Mock 路由
        size: size,
        mode: mode,
        processingTime: delay,
        isMock: true // 标记为模拟结果
      }
    });

  } catch (error) {
    console.error('Mock API error:', error);
    return NextResponse.json({ error: 'Mock processing failed' }, { status: 500 });
  }
}

// Mock 结果获取
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  // 返回一个 1x1 透明 PNG
  const transparentPixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );

  return new NextResponse(transparentPixel, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache'
    }
  });
}
```

### 1.2 创建 Mock 版本的水印编辑器

```typescript
// src/components/watermark-editor/index.mock.tsx

// 在 WatermarkEditor 中添加 Mock 模式
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

const API_ENDPOINT = USE_MOCK_API ? '/api/mock-seededit' : '/api/seededit';

// 使用 Mock 端点
const response = await fetch(API_ENDPOINT, {
  method: 'POST',
  body: formData
});
```

### 1.3 环境变量配置

```bash
# .env.local
# 开启 Mock 模式
NEXT_PUBLIC_USE_MOCK_API=true
```

### 1.4 测试额度用尽场景

```typescript
// 创建测试脚本

// src/scripts/test-credit-exhaustion.ts
async function testCreditExhaustion() {
  // 1. 注册用户（获取 10 张额度）
  const userId = await createTestUser();

  // 2. 模拟使用 10 次额度（但不调用真实 API）
  for (let i = 0; i < 10; i++) {
    await deductCredits(userId); // 使用 Mock deductCredits
  }

  // 3. 尝试第 11 次
  try {
    await checkUserCredits(userId);
    console.error('❌ 应该抛出额度用尽错误');
  } catch (error) {
    console.log('✅ 正确检测到额度用尽');
    console.log('错误信息:', error.message);
  }

  // 4. 验证前端显示
  // 访问页面，查看是否显示升级提示
}
```

---

## 方案二：Stub 模式（拦截 API 调用）

### 2.1 创建 API Stub

```typescript
// src/lib/api-stubs/seededit.stub.ts

/**
 * ByteDance Ark API Stub
 * 拦截真实 API 调用，返回模拟结果
 */

export class SeedEditStub {
  private static isEnabled = process.env.NODE_ENV === 'development' &&
                               process.env.USE_STUB === 'true';

  /**
   * 模拟图片处理
   */
  static async processImage(image: File, mode: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    console.log('[STUB] Mocking image processing...');
    console.log('[STUB] Image size:', image.size);
    console.log('[STUB] Mode:', mode);

    // 模拟处理时间
    await this.simulateProcessing();

    // 返回模拟结果
    return {
      success: true,
      data: {
        id: `stub-${Date.now()}`,
        url: URL.createObjectURL(image), // 返回原图
        size: image.size,
        mode: mode,
        isStub: true
      }
    };
  }

  /**
   * 模拟处理延迟
   */
  private static async simulateProcessing(): Promise<void> {
    // 随机延迟 100ms - 1500ms
    const delay = Math.random() * 1400 + 100;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 检查是否应该使用 Stub
   */
  static shouldUseStub(): boolean {
    return this.isEnabled;
  }
}
```

### 2.2 修改 API 路由使用 Stub

```typescript
// src/app/api/seededit/route.ts

import { SeedEditStub } from '@/lib/api-stubs/seededit.stub';

export async function POST(req: NextRequest) {
  // 1. 检查额度（真实检查）
  const credits = await checkUserCredits(...);

  if (credits.remaining <= 0) {
    return NextResponse.json({
      error: "额度已用完",
      details: `您本月已使用 ${credits.used} / ${tierConfig.maxPerMonth} 张额度`,
      // ...
    }, { status: 403 });
  }

  // 2. 尝试调用真实 API（但在开发环境中会自动回退到 Stub）
  let result;
  if (SeedEditStub.shouldUseStub()) {
    result = await SeedEditStub.processImage(image, mode);
  } else {
    // 真实 API 调用
    result = await callRealSeedEditAPI(image, mode);
  }

  // 3. 扣除额度（真实扣除）
  if (result.success) {
    await deductCredits(userId);
  }

  return NextResponse.json(result);
}
```

### 2.3 环境变量

```bash
# .env.local
# 使用 Stub 模式（不调用真实 API）
USE_STUB=true
```

---

## 方案三：测试数据库（真实 API，低成本）

### 3.1 创建测试环境

```bash
# 1. 创建测试 Supabase 项目
# Supabase 控制台 -> New Project -> Test Environment

# 2. 配置环境变量
# .env.test.local
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-key

# 3. 使用测试 API 密钥（不会被收费或额度很低）
ARK_API_KEY=test-key-allowed-for-10-calls
FAL_AI_API_KEY=test-key
```

### 3.2 创建专用测试用户

```sql
-- 连接到测试数据库
INSERT INTO wmc_users (email, tier, creditsused, creditsreset)
VALUES
  ('test-user-1@example.com', 'verified', 9, NOW()), -- 剩1张
  ('test-user-2@example.com', 'verified', 10, NOW()), -- 用完
  ('test-user-3@example.com', 'unverified', 0, NOW()); -- 未验证
```

### 3.3 自动化测试脚本

```typescript
// test/credit-exhaustion.test.ts
import { createAdminClient } from '@/lib/supabase-admin';
import { deductCredits, checkCredits } from '@/lib/credits/check';

describe('Credit Exhaustion Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // 创建测试用户
    testUserId = await createTestUser('verified', 9); // 9/10
  });

  afterAll(async () => {
    // 清理测试数据
    await deleteTestUser(testUserId);
  });

  test('should allow the 10th image', async () => {
    // 第10张应该成功
    expect(await checkCredits(testUserId)).toHaveProperty('remaining', 1);
    await deductCredits(testUserId); // 使用第10张
    expect(await checkCredits(testUserId)).toHaveProperty('remaining', 0);
  });

  test('should block the 11th image', async () => {
    // 第11张应该失败
    const credits = await checkCredits(testUserId);
    expect(credits.remaining).toBe(0);
  });

  test('should show correct upgrade links', async () => {
    // 验证已验证用户看到正确的升级选项
    const response = await fetch('/api/seededit', {
      method: 'POST',
      body: createTestFormData()
    });

    const result = await response.json();
    expect(result.error).toBe('额度已用完');
    expect(result.upgradeUrl).toBe('/pricing');
  });
});
```

---

## 方案四：部分 Mock（混合模式）

### 4.1 只 Mock 昂贵的 AI 调用

```typescript
// src/lib/ai-providers/ark.ts

export async function processWithArk(image: File, mode: string) {
  // 只在生产环境调用真实 API
  if (process.env.NODE_ENV === 'production') {
    return await realArkAPI(image, mode);
  }

  // 开发环境返回 Mock 结果
  console.warn('[DEV] Using mock AI result');

  return {
    success: true,
    image: await createMockProcessedImage(image), // 稍微修改原图
    processingTime: 1500
  };
}
```

### 4.2 保留真实的数据库操作

```typescript
// 这部分保持真实
await deductCredits(userId);           // 真实扣除
await recordProcessingHistory(...);    // 真实记录
await updateUserStats(...);            // 真实更新
```

---

## 推荐测试流程

### 阶段 1: 单元测试（Mock）

```bash
# 测试额度检查逻辑
npm test credits.check.test.ts

# 测试配额用尽提示
npm test credit-exhaustion.test.ts
```

### 阶段 2: 集成测试（Stub）

```bash
# 使用 Stub 模式测试完整流程
USE_STUB=true npm run dev

# 手动测试：
# 1. 使用 test-user-1 (剩1张) - 应该成功
# 2. 再次处理 - 应该显示额度用尽
# 3. 验证升级链接是否正确
```

### 阶段 3: 生产验证（真实 API，有限测试）

```bash
# 部署到 staging 环境
# 使用测试 API 密钥（有限额度）
# 只测试关键路径：
# - 第 1 张：成功
# - 第 10 张：成功
# - 第 11 张：失败 + 提示

# 自动化 E2E 测试 (Playwright)
npm run test:e2e credit-exhaustion
```

---

## 额度用尽场景的测试清单

### 测试用例

#### 1. 未验证用户（3张额度）
- [ ] 使用 0/3 → 显示升级提示（验证邮箱）
- [ ] 使用 2/3 → 显示警告（剩余 1 张）
- [ ] 使用 3/3 → 阻止处理，提示升级
- [ ] 验证链接指向 `/auth/signin`
- [ ] Toast 提示清晰友好

#### 2. 已验证用户（10张额度）
- [ ] 使用 8/10 → 显示警告（剩余 2 张）
- [ ] 使用 9/10 → 显示紧急警告（剩余 1 张）
- [ ] 使用 10/10 → 阻止处理，提示升级
- [ ] 验证链接指向 `/pricing`
- [ ] 显示专业版优势

#### 3. 专业版用户（∞）
- [ ] 不显示额度限制
- [ ] 不显示升级提示
- [ ] 始终允许处理

#### 4. 额度检查 API
- [ ] `/api/credits/check` 返回正确数据
- [ ] 更新额度后刷新显示
- [ ] 多个浏览器标签页同步更新
- [ ] 移动端显示正常

#### 5. 错误处理
- [ ] API 调用失败时的回退提示
- [ ] 网络错误时的重试机制
- [ ] 额度扣除失败时的回滚
- [ ] 异步操作的一致性

---

## 测试数据管理

### 方法 1: 测试数据库快照

```bash
# 创建额度用尽用户的快照
createdb watermarkcleaner_test_snapshot

# 恢复到特定状态
pg_restore -d watermarkcleaner_test_snapshot credits_exhausted_state.dump
```

### 方法 2: 动态创建测试用户

```typescript
// 每次测试创建新用户（隔离）
async function createTestUserWithCredits(used: number, tier: UserTier) {
  const userId = crypto.randomUUID();

  await supabase.from('wmc_users').insert({
    id: userId,
    email: `test-${userId}@example.com`,
    tier,
    creditsused: used,
    creditsreset: new Date().toISOString()
  });

  return userId;
}

// 测试后删除
afterEach(async () => {
  await deleteTestUser(userId);
});
```

---

## 成本对比

| 测试方式 | 单次成本 | 10次测试 | 100次测试 | 优点 | 缺点 |
|---------|---------|----------|-----------|------|------|
| 真实 API | ~$0.05 | $0.5 | $5 | 最真实 | 成本高 |
| Mock API | $0 | $0 | $0 | 零成本 | 不真实 |
| Stub | $0 | $0 | $0 | 零成本 | 不真实 |
| 测试环境 API | ~$0.001 | $0.01 | $0.1 | 低成本 | 需维护 |

推荐组合：
- 开发阶段：Mock + Stub
- PR 阶段：测试环境 API（有限调用）
- 生产验证：真实 API（仅关键路径）

---

## 快速开始

### 步骤 1: 启用 Mock 模式

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_API=true
```

### 步骤 2: 测试额度用尽

```typescript
// 手动测试脚本
async function testExhaustion() {
  console.log('测试额度用尽场景...\n');

  // 创建还剩 1 张的用户
  const userId = await createTestUser('verified', 9);
  console.log(`✅ 创建用户: ${userId}`);

  // 第 10 张（应该成功）
  console.log('📸 处理第 10 张图片...');
  const result1 = await processImage(userId);
  console.log(result1.success ? '✅ 成功' : '❌ 失败');

  // 检查剩余额度
  const credits = await checkCredits(userId);
  console.log(`📊 剩余额度: ${credits.remaining}/${credits.limit}`);

  // 第 11 张（应该失败）
  console.log('\n📸 尝试处理第 11 张图片...');
  const result2 = await processImage(userId);
  console.log(result2.success ? '❌ 应该失败' : '✅ 正确阻止');
  console.log('错误信息:', result2.error);
  console.log('升级链接:', result2.upgradeUrl);

  // 清理
  await deleteTestUser(userId);
  console.log('\n🧹 清理完成');
}
```

### 步骤 3: 运行测试

```bash
# 终端 1：启动应用
NEXT_PUBLIC_USE_MOCK_API=true npm run dev

# 终端 2：运行测试
node scripts/test-credit-exhaustion.js
```

---

## 总结

### 额度用尽提示

**当前提示完整流程**:
1. `CreditsDisplay` 显示剩余 5 张时提示升级 ✅
2. API 返回 403 阻止处理 ✅
3. 显示具体使用量（如"10/10 已用完"）✅
4. 提供升级链接（验证/定价）✅
5. **缺少**: 前端 Toast/弹窗美化 ✅（建议改进）

### 测试建议

**最优方案（零成本）**:
1. 开发环境启用 `NEXT_PUBLIC_USE_MOCK_API=true`
2. 创建 Mock API 路由（返回模拟图片）
3. 编写自动化测试脚本（模拟 10 张额度使用）
4. 验证提示信息和升级流程
5. 部署前在测试环境用真实 API 验证关键路径

**成本**: $0（开发） + $0.1（测试） = $0.1

---

## 改进建议

### 1. 美化额度用尽错误提示

```typescript
// src/components/watermark-editor/index.tsx

const handleError = (error: any) => {
  if (error.details?.includes('额度已用完')) {
    toast.custom((t) => (  // 使用自定义 Toast
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <h3 className="font-bold text-red-800 mb-2">😅 额度已用完</h3>
        <p className="text-sm text-red-700 mb-3">
          您本月已使用 <span className="font-semibold">{error.used}</span> / <span className="font-semibold">{error.max}</span> 张额度
        </p>
        {error.upgradeUrl && (
          <a
            href={error.upgradeUrl}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            onClick={() => toast.dismiss(t.id)}
          >
            {error.action} <span aria-hidden>→</span>
          </a>
        )}
      </div>
    ), { duration: Infinity }); // 需要用户手动关闭
  }
};
```

### 2. 添加额度重置倒计时

```typescript
// 显示下次重置时间（每月1日）
const daysUntilReset = getDaysUntilFirstOfMonth();
if (daysUntilReset <= 3) {
  toast.info(`额度将在 ${daysUntilReset} 天后重置`);
}
```

### 3. 添加紧急额度

```typescript
// 允许用户观看广告或邀请好友获得紧急额度
if (credits.remaining === 0) {
  showModal({
    title: '额度已用完',
    content: '您可以通过以下方式获得紧急额度：',
    actions: [
      { text: '观看广告（+1张）', onClick: showAd },
      { text: '邀请好友（+3张）', onClick: shareInvite },
      { text: '升级专业版', onClick: () => router.push('/pricing') }
    ]
  });
}
```

---

**文档版本**: 1.0
**创建时间**: 2026-01-03
**建议优先级**: 🔴 高（测试效率提升 10x）
