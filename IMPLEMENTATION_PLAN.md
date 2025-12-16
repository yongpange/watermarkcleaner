# 邮箱验证系统实施计划

## 策略：3-10分层（已调整）

### 用户层级
```typescript
unverified: {
  maxPerMonth: 3,    // 每月3张
  displayName: "免费试用"
}
verified: {
  maxPerMonth: 10,   // 每月10张（邮箱验证后）
  displayName: "已验证用户"
}
pro: {
  maxPerMonth: Infinity,  // 无限
  displayName: "专业版"
}
```

## 实施步骤

### 1. 安装依赖
```bash
npm install next-auth @prisma/client @auth/prisma-adapter
npm install nodemailer
npm install resend  # 或使用其他邮件服务
npm install -D prisma
```

### 2. 配置NextAuth.js
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user = user;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 3. 更新Prisma Schema
```prisma
// prisma/schema.prisma

model Account {
  // ... NextAuth required fields
}

model Session {
  // ... NextAuth required fields
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  
  // 自定义字段
  tier          String    @default("unverified")  // unverified, verified, pro
  creditsUsed   Int       @default(0)  // 本月已使用额度
  creditsReset  DateTime  @default(now())
  processingHistory ProcessingHistory[]
}

model ProcessingHistory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  timestamp DateTime @default(now())
  imageSize Int
  success   Boolean
  
  @@index([userId, timestamp])
}

model VerificationToken {
  // ... NextAuth required fields
}
```

### 4. 创建额度检查逻辑
```typescript
// src/lib/credits/check.ts
import { prisma } from '@/lib/prisma';
import { USER_TIER_CONFIG } from '@/lib/rate-limit';

export async function checkCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // 检查是否需要重置额度（每月1号）
  const now = new Date();
  const lastReset = new Date(user.creditsReset);
  
  if (now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    // 重置额度
    await prisma.user.update({
      where: { id: userId },
      data: {
        creditsUsed: 0,
        creditsReset: now,
      },
    });
    
    return {
      tier: user.tier,
      used: 0,
      limit: USER_TIER_CONFIG[user.tier as keyof typeof USER_TIER_CONFIG].maxPerMonth,
      remaining: USER_TIER_CONFIG[user.tier as keyof typeof USER_TIER_CONFIG].maxPerMonth,
    };
  }
  
  const tierConfig = USER_TIER_CONFIG[user.tier as keyof typeof USER_TIER_CONFIG];
  
  return {
    tier: user.tier,
    used: user.creditsUsed,
    limit: tierConfig.maxPerMonth,
    remaining: Math.max(0, tierConfig.maxPerMonth - user.creditsUsed),
  };
}
```

### 5. 集成到API
```typescript
// src/app/api/seededit/route.ts

// 添加用户认证检查
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  // 使用IP限流（未登录用户）
  const rateLimit = await checkRateLimitByIp(ip, "unverified");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "IP rate limit exceeded" }, { status: 429 });
  }
} else {
  // 使用用户ID限流（已登录用户）
  const credits = await checkCredits(session.user.id);
  if (credits.remaining <= 0) {
    return NextResponse.json({ 
      error: "Monthly credits exhausted",
      action: "Upgrade to Pro for unlimited processing"
    }, { status: 403 });
  }
  
  // 扣除额度
  await prisma.user.update({
    where: { id: session.user.id },
    data: { creditsUsed: { increment: 1 } },
  });
}
```

### 6. 前端UI更新
```typescript
// src/components/CreditsDisplay.tsx
export function CreditsDisplay() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(null);
  
  useEffect(() => {
    if (session?.user) {
      fetch("/api/credits/check")
        .then(res => res.json())
        .then(data => setCredits(data));
    }
  }, [session]);
  
  if (!credits) return null;
  
  return (
    <div className="p-3 bg-gray-100 rounded-lg">
      <div className="text-sm">
        本月额度: {credits.used} / {credits.limit === Infinity ? '∞' : credits.limit}
      </div>
      <div className="text-xs text-gray-600">
        剩余: {credits.limit === Infinity ? '∞' : credits.remaining} 张
      </div>
      {credits.remaining <= 3 && credits.tier !== 'pro' && (
        <Link href="/pricing" className="text-blue-600 text-xs">
          升级获得更多额度 →
        </Link>
      )}
    </div>
  );
}
```

### 7. 验证提示组件
```typescript
// src/components/VerificationPrompt.tsx
export function VerificationPrompt() {
  const { data: session } = useSession();
  
  if (session?.user?.emailVerified) return null;
  
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-medium text-yellow-800">验证邮箱获得更多额度</h3>
      <p className="text-sm text-yellow-700 mt-1">
        验证后可获得10张/月（当前：3张/月）
      </p>
      <button 
        onClick={() => signIn('email', { email: session.user.email })}
        className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
      >
        发送验证邮件
      </button>
    </div>
  );
}
```

## 实施优先级

### P1: 核心功能（2-3天）
- [ ] 安装依赖
- [ ] 配置NextAuth
- [ ] 更新Database Schema
- [ ] 基础额度检查
- [ ] 集成到API

### P2: 用户体验（1-2天）
- [ ] 创建CreditsDisplay组件
- [ ] 创建VerificationPrompt组件
- [ ] 添加额度不足提示
- [ ] 优化错误消息

### P3: 优化（1天）
- [ ] 创建管理后台
- [ ] 添加监控告警
- [ ] 测试所有边界情况

## 需要配置的环境变量

```bash
# .env.local

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# 邮件服务（Resend示例）
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# 数据库
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# 可选：Upstash Redis（用于分布式限流）
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-token
```

## 测试清单

- [ ] 未验证用户只能处理3张
- [ ] 验证邮箱后额度增加到10张
- [ ] 每月1号自动重置额度
- [ ] 额度用完时显示友好提示
- [ ] 额度不足引导到升级页面
- [ ] 正确处理并发请求
- [ ] 邮件发送正常
- [ ] 验证链接有效
