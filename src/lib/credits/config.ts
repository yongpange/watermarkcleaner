/**
 * 用户额度配置 - 纯配置常量，可在客户端和服务器端使用
 */

export type UserTier = 'unverified' | 'verified' | 'pro';

export interface UserTierConfig {
  maxPerMonth: number; // Maximum images (now permanent lifetime credits)
  displayName: string; // Display name for the tier
}

/**
 * 用户等级配置 - 用于在客户端显示额度信息
 * 注意：实际检查逻辑在服务器端执行 (check.ts)
 */
export const USER_TIER_CONFIG: Record<UserTier, UserTierConfig> = {
  unverified: {
    maxPerMonth: 3, // 3 images for unverified users
    displayName: '免费试用',
  },
  verified: {
    maxPerMonth: 3, // 3 images for verified users
    displayName: '免费试用',
  },
  pro: {
    maxPerMonth: Infinity, // Infinite credits for pro users (paid)
    displayName: '专业版',
  },
};

// 导出所有等级类型，方便类型判断
export const USER_TIERS = Object.keys(USER_TIER_CONFIG) as UserTier[];
