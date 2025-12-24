import { NextRequest, NextResponse } from "next/server";

// 简单的内存存储（适合小规模部署）
// 如果需要分布式部署，可以替换为 Redis
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CONFIG = {
  // 每小时最多处理次数（同一IP）
  MAX_REQUESTS_PER_HOUR: 10,

  // 窗口期（毫秒）
  WINDOW_MS: 60 * 60 * 1000, // 1小时

  // 清理间隔（毫秒）
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1小时
};

/**
 * 清理过期的限流记录
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 启动定时清理（每小时清理一次）
setInterval(cleanupExpiredEntries, CONFIG.CLEANUP_INTERVAL_MS);

/**
 * 获取客户端IP地址
 */
function getClientIp(request: NextRequest): string {
  // 尝试从多个头获取IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // 如果都没有，使用一个默认值（在开发环境中）
  // 在生产环境应该配置反向代理传递真实IP
  return "unknown-ip";
}

/**
 * 检查是否超出速率限制
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = CONFIG.MAX_REQUESTS_PER_HOUR,
  windowMs: number = CONFIG.WINDOW_MS
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;

  const entry = rateLimitStore.get(key);

  // 如果没有记录或已过期，创建新记录
  if (!entry || now >= entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 如果已达到限制，拒绝请求
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // 否则增加计数
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * 速率限制中间件
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  options: {
    limit?: number;
    windowMs?: number;
  } = {}
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  const identifier = getClientIp(request);

  const result = await checkRateLimit(
    identifier,
    options.limit || CONFIG.MAX_REQUESTS_PER_HOUR,
    options.windowMs || CONFIG.WINDOW_MS
  );

  // 添加响应头（便于客户端显示剩余次数）
  const headers = {
    "X-RateLimit-Limit": String(options.limit || CONFIG.MAX_REQUESTS_PER_HOUR),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetTime),
  };

  if (!result.allowed) {
    return {
      ...result,
      limit: options.limit || CONFIG.MAX_REQUESTS_PER_HOUR,
      response: NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `已达到速率限制。请等待 ${Math.ceil((result.resetTime - Date.now()) / 1000 / 60)} 分钟后再试。`,
          limit: options.limit || CONFIG.MAX_REQUESTS_PER_HOUR,
          remaining: 0,
          resetTime: result.resetTime,
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          },
        }
      ),
    };
  }

  // 创建成功的响应（但实际上只是返回结果，不创建响应）
  return {
    ...result,
    limit: options.limit || CONFIG.MAX_REQUESTS_PER_HOUR,
    response: undefined,
  };
}

/**
 * 获取用户处理历史（简单内存存储）
 */
interface ProcessingRecord {
  timestamp: number;
  imageSize: number;
  success: boolean;
}

const processingHistory = new Map<string, ProcessingRecord[]>();

/**
 * 记录用户处理历史
 */
export function recordProcessing(
  identifier: string,
  imageSize: number,
  success: boolean
) {
  const key = `processing:${identifier}`;
  const records = processingHistory.get(key) || [];

  records.push({
    timestamp: Date.now(),
    imageSize,
    success,
  });

  // 只保留最近30天的记录
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const filteredRecords = records.filter(r => r.timestamp > thirtyDaysAgo);

  processingHistory.set(key, filteredRecords);

  return filteredRecords.length;
}

/**
 * 获取用户在指定时间内处理的总次数
 */
export function getProcessingCount(
  identifier: string,
  timeWindowMs: number = 30 * 24 * 60 * 60 * 1000
): number {
  const key = `processing:${identifier}`;
  const records = processingHistory.get(key) || [];

  const cutoffTime = Date.now() - timeWindowMs;
  return records.filter(r => r.timestamp > cutoffTime).length;
}

/**
 * 获取用户在指定时间内处理的总图片大小
 */
export function getTotalProcessedSize(
  identifier: string,
  timeWindowMs: number = 30 * 24 * 60 * 60 * 1000
): number {
  const key = `processing:${identifier}`;
  const records = processingHistory.get(key) || [];

  const cutoffTime = Date.now() - timeWindowMs;
  return records
    .filter(r => r.timestamp > cutoffTime)
    .reduce((total, r) => total + r.imageSize, 0);
}

/**
 * 验证用户类型（简化版：3-10分层）
 */
export type UserTier = "unverified" | "verified" | "pro";

export interface UserTierConfig {
  maxRequests: number;        // 每小时最大请求数
  maxPerMonth: number;        // 每月最大处理次数
  processingPriority: "low" | "medium" | "high";
  features: string[];
  displayName: string;        // 显示名称
}

export const USER_TIER_CONFIG: Record<UserTier, UserTierConfig> = {
  "unverified": {
    maxRequests: 3,           // 每小时3次请求限制
    maxPerMonth: 3,          // 每月最多3张（保守策略）
    processingPriority: "low",
    features: ["basic-processing"],
    displayName: "免费试用",
  },
  "verified": {
    maxRequests: 10,          // 每小时10次请求限制
    maxPerMonth: 10,         // 每月最多10张（邮箱验证后）
    processingPriority: "medium",
    features: ["basic-processing", "high-res"],
    displayName: "已验证用户",
  },
  "pro": {
    maxRequests: 50,          // 每小时50次请求限制
    maxPerMonth: Infinity,    // 无限处理（付费用户）
    processingPriority: "high",
    features: ["basic-processing", "high-res", "batch-mode", "api-access", "priority-support"],
    displayName: "专业版",
  },
};

/**
 * 检查用户是否达到月度限额（简化版：3-10分层）
 * @param identifier - 用户标识（IP地址或用户ID）
 * @param tier - 用户层级（unverified/verified/pro）
 * @returns 检查结果
 */
export function checkMonthlyLimit(
  identifier: string,
  tier: UserTier = "unverified"
): {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
} {
  const tierConfig = USER_TIER_CONFIG[tier];
  const current = getProcessingCount(identifier);

  return {
    allowed: current < tierConfig.maxPerMonth,
    current,
    limit: tierConfig.maxPerMonth,
    remaining: Math.max(0, tierConfig.maxPerMonth - current),
  };
}
