/**
 * NextAuth.js 类型扩展
 * 用于支持邮箱验证码认证系统和自定义字段
 */



/**
 * 用户等级枚举
 */
export enum UserTier {
  UNVERIFIED = 'unverified',    // 免费试用（3张/月）
  VERIFIED = 'verified',        // 已验证用户（10张/月）
  PRO = 'pro'                   // 专业版（无限）
}

/**
 * 邮箱验证码凭据接口
 * 用于 Credentials Provider 的邮箱验证码认证
 */
export interface EmailCodeCredentials {
  email: string;
  code: string;
  purpose: 'register' | 'login' | 'update_email';
}

declare module "next-auth" {
  /**
   * 扩展NextAuth会话中的用户对象
   * 添加与wmc_users表兼容的字段
   */
  interface User {
    id: string;
    email: string;
    username?: string;
    name?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
    tier: UserTier;
    creditsUsed: number;
    creditsReset?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;

    // 扩展字段（来自wmc_users表，可选，可空）
    nickname?: string | null;
    avatarUrl?: string | null;
  }
}

// 重新导出User类型，使其在模块外部也可用
export type User = import("next-auth").User;
