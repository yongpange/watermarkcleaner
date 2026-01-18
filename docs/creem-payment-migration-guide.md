# CREEM支付系统迁移完成指南

## ✅ 迁移完成状态

所有核心支付系统组件已成功迁移并创建完成！

### 已创建的组件（共20+文件）

#### 1. 数据库层（4个迁移文件）
- ✅ `supabase/migrations/20260115_create_wmc_order.sql` - 支付订单表
- ✅ `supabase/migrations/20260115_create_wmc_subscription.sql` - 订阅管理表
- ✅ `supabase/migrations/20260115_create_wmc_credit.sql` - 信用额度表
- ✅ `supabase/migrations/20260115_add_payment_fields_to_wmc_users.sql` - 用户表扩展字段

#### 2. 支付抽象层（3个文件）
- ✅ `src/extensions/payment/types.ts` - 支付类型定义（300+行）
- ✅ `src/extensions/payment/index.ts` - 支付管理器（150+行）
- ✅ `src/extensions/payment/creem.ts` - CREEM支付提供商（650+行）

#### 3. 数据模型层（3个文件）
- ✅ `src/lib/models/order.ts` - 订单CRUD操作
- ✅ `src/lib/models/subscription.ts` - 订阅管理
- ✅ `src/lib/models/credit.ts` - 额度管理系统（FIFO算法）

#### 4. 服务层（2个文件）
- ✅ `src/lib/payment/service.ts` - 支付业务逻辑（400+行）
- ✅ `src/lib/payment/utils.ts` - 支付工具函数

#### 5. API路由（2个文件）
- ✅ `src/app/api/payment/checkout/route.ts` - 结账API
- ✅ `src/app/api/payment/notify/[provider]/route.ts` - Webhook处理

#### 6. 配置文件
- ✅ `.env.local.example` - 完整配置模板

---

## 🚀 快速启动指南

### 第1步：配置环境变量

复制配置文件：
```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的CREEM凭证：

```bash
# CREEM API Key（必填）
CREEM_API_KEY=your_creem_api_key_here

# CREEM Webhook签名密钥（必填）
CREEM_SIGNING_SECRET=your_creem_signing_secret_here

# 环境：sandbox（测试）或 production（生产）
CREEM_ENVIRONMENT=sandbox

# 产品ID映射（JSON格式）
# 从 https://dashboard.creem.io/products 获取
CREEM_PRODUCT_IDS={"pro-monthly":"prod_xxxxx","business-monthly":"prod_yyyyy"}

# 启用CREEM
CREEM_ENABLED=true

# 设置默认支付提供商
DEFAULT_PAYMENT_PROVIDER=creem

# 数据库配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# IP哈希盐值（可选，但推荐）
IP_HASH_SALT=your_random_salt_here
```

### 第2步：运行数据库迁移

在Supabase Studio或通过SQL编辑器执行以下迁移文件：

1. **创建订单表**：
```bash
# 在 Supabase Studio → SQL Editor
# 粘贴 supabase/migrations/20260115_create_wmc_order.sql 内容
```

2. **创建订阅表**：
```bash
# 粘贴 supabase/migrations/20260115_create_wmc_subscription.sql 内容
```

3. **创建信用额度表**：
```bash
# 粘贴 supabase/migrations/20260115_create_wmc_credit.sql 内容
```

4. **更新用户表**：
```bash
# 粘贴 supabase/migrations/20260115_add_payment_fields_to_wmc_users.sql 内容
```

### 第3步：配置Webhook

#### 本地开发测试（使用ngrok）

1. **安装ngrok**：
```bash
npm install -g ngrok
```

2. **启动ngrok**：
```bash
ngrok http 3000
```

3. **复制ngrok提供的公网URL**：
```
https://abc123.ngrok.io
```

4. **在Creem后台配置Webhook**：
   - Dashboard → Settings → Webhooks
   - Add Webhook Endpoint: `https://abc123.ngrok.io/api/payment/notify/creem`
   - Events: 全选所有事件
   - 复制Signing Secret → 填入 `.env.local`

#### 生产环境配置

1. **在Vercel配置域名**：
```
https://yourdomain.com/api/payment/notify/creem
```

2. **在Creem后台配置Webhook URL**

3. **确保环境变量设置**：
```bash
CREEM_SIGNING_SECRET=your_production_signing_secret
CREEM_ENVIRONMENT=production
```

---

## 🎨 使用示例

### 前端调用示例

```typescript
// 创建支付会话
const handleUpgrade = async (tier: string) => {
  const response = await fetch('/api/payment/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: tier, // 'pro-monthly' or 'business-monthly'
      product_name: 'Pro Monthly',
      amount: 999, // $9.99 in cents
      currency: 'usd',
      payment_type: 'subscription',
      payment_interval: 'month',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/pricing',
    }),
  });

  const result = await response.json();

  if (result.success) {
    // 重定向到支付页面
    window.location.href = result.data.checkoutUrl;
  } else {
    alert(`支付失败: ${result.error}`);
  }
};
```

### 查询用户额度

```typescript
// 检查用户额度
import { userHasCredits } from '@/lib/payment/utils';

async function checkCredits(userId: string) {
  const hasCredit = await userHasCredits(userId, 1); // 至少需要1个额度

  if (!hasCredit) {
    alert('额度已用完，请升级Pro');
    return;
  }

  // 处理图片...
}
```

### 扣减额度

```typescript
// 处理完成后扣减额度
import { PaymentUtils } from '@/lib/payment/utils';

async function processImage(userId: string, image: File) {
  try {
    // 1. 处理图片
    const result = await removeWatermark(image);

    // 2. 扣减1个额度
    await PaymentUtils.consumeCredits(userId, 1, {
      scene: 'image_processing',
      imageSize: `${(image.size / 1024).toFixed(2)}KB`,
      metadata: { imageId: result.id },
    });

    return result;
  } catch (error) {
    console.error('处理失败:', error);
  }
}
```

---

## 📋 API文档

### POST `/api/payment/checkout`

**创建支付会话**

**请求体：**
```json
{
  "product_id": "pro-monthly",
  "product_name": "Pro Monthly",
  "amount": 999,
  "currency": "usd",
  "payment_type": "subscription",
  "payment_interval": "month",
  "success_url": "http://localhost:3000/success",
  "cancel_url": "http://localhost:3000/pricing"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.creem.io/session/...",
    "sessionId": "checkout_xxxxx",
    "orderNo": "ORD-xxxxxx"
  }
}
```

### GET `/api/payment/notify/[provider]`

**Webhook通知端点**（自动处理）

**支持的provider：**
- `creem` - Creem Webhook
- `stripe` - Stripe Webhook（未来支持）
- `paypal` - PayPal Webhook（未来支持）

---

## 🔒 安全特性

1. **Webhook签名验证**：所有webhook请求都使用HMAC-SHA256签名验证
2. **价格验证**：服务器端验证价格，防止客户端篡改
3. **幂等性保证**：重复支付不会多次扣减或授予额度
4. **事务处理**：数据库操作确保数据一致性
5. **IP匿名化**：用户IP使用SHA-256哈希存储

---

## 💰 额度系统说明

### 额度计算规则

**免费用户：**
- 基于 `wmc_processing_history` 计数
- 限制：每月3次
- 升级Pro后：切换为信用额度系统

**Pro用户：**
- 基于 `wmc_credit` 表管理
- 购买时授予额度（例如200 credits）
- 每次处理图片扣减1 credit
- 额度过期时间 = 订阅周期结束时间

### 额度授予策略

```typescript
// 购买Pro套餐（$9.99/月，200 credits）
await grantCredits({
  userId: 'user-123',
  credits: 200,
  subscriptionNo: 'SUB-xxxxx',
  expiresAt: subscription.current_period_end, // 2月13日 23:59
  scene: 'subscription',
  description: 'Pro月度套餐 - 首次购买',
});

// 续费后再次授予200 credits（总额度400）
// 优先消耗即将过期的额度（FIFO算法）
```

---

## 🐛 故障排查

### 常见问题

**1. Webhook接收失败**
- 检查ngrok是否运行
- 验证CREEM_SIGNING_SECRET是否正确
- 查看Vercel函数日志

**2. 额度未授予**
- 检查订单状态是否为"paid"
- 查看 `wmc_credit` 表是否有记录
- 检查用户订阅状态

**3. 价格验证失败**
- 确认环境变量中的产品ID映射正确
- 检查 `CREEM_PRODUCT_IDS` 格式

**4. 无法创建支付会话**
- 验证 `CREEM_API_KEY` 是否正确
- 确认产品ID在Creem后台存在
- 检查网络连接

---

## 🔧 高级配置

### 添加更多订阅等级

在 `.env.local` 中配置：

```bash
CREEM_PRODUCT_IDS='{
  "basic-monthly": "prod_yyyyy",
  "pro-monthly": "prod_xxxxx",
  "business-monthly": "prod_zzzzz",
  "enterprise-yearly": "prod_wwwww"
}'
```

并在代码中添加对应配置：

```typescript
// src/lib/models/order.ts
const tierConfigs = {
  'enterprise-yearly': {
    amount: 9999,
    credits: 5000,
    currency: 'usd',
    validDays: 365,
  },
};
```

### 启用多个支付提供商

修改 `src/lib/payment/service.ts`：

```typescript
// 启用Stripe
if (configs.stripe.enabled) {
  const stripeProvider = new StripeProvider({
    secretKey: configs.stripe.secretKey,
    signingSecret: configs.stripe.signingSecret,
  });
  paymentManager.addProvider(stripeProvider);
}

// 启用PayPal
if (configs.paypal.enabled) {
  const paypalProvider = new PayPalProvider({
    clientId: configs.paypal.clientId,
    secret: configs.paypal.secret,
  });
  paymentManager.addProvider(paypalProvider);
}
```

---

## 📊 监控与日志

### 查看支付日志

在Vercel Dashboard → Functions中查看：
- `/api/payment/checkout` - 结账请求日志
- `/api/payment/notify/creem` - Webhook处理日志

### 数据库监控

在Supabase Dashboard → SQL Editor中查询：

```sql
-- 查看最近订单
SELECT * FROM wmc_order ORDER BY created_at DESC LIMIT 10;

-- 查看订阅状态
SELECT * FROM wmc_subscription WHERE status = 'active';

-- 查看用户额度余额
SELECT user_id, get_credit_balance(user_id) as balance FROM wmc_users;
```

---

## 📞 技术支持

### Creem官方文档
- [API文档](https://docs.creem.io)
- [Webhook事件](https://docs.creem.io/webhooks)

### 常见问题

Q: 如何测试Webhook？
A: 使用ngrok进行本地测试，或使用Creem CLI: `creem webhooks:trigger`

Q: 沙盒环境和生产环境如何切换？
A: 修改 `.env.local` 中的 `CREEM_ENVIRONMENT` 和 `CREEM_API_KEY`

Q: 额度过期后如何处理？
A: 系统自动标记为expired，用户需要续费或购买新的额度包

---

## 🎯 下一步计划

### 立即可以做的事情
1. ✅ 配置环境变量并测试支付流程
2. ✅ 在前端集成支付按钮
3. ✅ 测试Webhook处理

### 第二期功能
- [ ] 发票管理和下载
- [ ] Stripe支付集成
- [ ] 推荐返现系统
- [ ] 额外额度包购买
- [ ] 多币种支持

---

## 📦 文件结构

```
src/
├── extensions/
│   └── payment/
│       ├── types.ts          # 支付类型定义
│       ├── index.ts          # 支付管理器
│       └── creem.ts          # Creem提供商
├── lib/
│   ├── models/
│   │   ├── order.ts          # 订单模型
│   │   ├── subscription.ts   # 订阅模型
│   │   └── credit.ts         # 额度模型
│   ├── payment/
│   │   ├── service.ts        # 支付服务
│   │   └── utils.ts          # 支付工具
│   └── supabase.ts
├── app/
│   └── api/
│       └── payment/
│           ├── checkout/
│           │   └── route.ts  # 结账API
│           └── notify/
│               └── [provider]/
│                   └── route.ts  # Webhook处理
└── .env.local.example          # 配置模板
```

---

## 🎉 恭喜！

你的CREEM支付系统已完全迁移并准备就绪！

**现在只需：**
1. 配置 `.env.local`
2. 运行数据库迁移
3. 配置Webhook
4. 开始接收支付！

**有问题？** 请查看本指南的故障排查部分或查看相关代码注释。
