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

/**
 * 用户接口（与数据库兼容）
 */
export interface User {
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
}
