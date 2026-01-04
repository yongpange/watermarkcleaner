import { randomInt, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';

// ============================================================================
// 常量定义
// ============================================================================

// 验证码长度（6位数字）
export const VERIFICATION_CODE_LENGTH = 6;

// 验证码有效期（15分钟）
export const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

// 最大尝试次数
export const MAX_VERIFICATION_ATTEMPTS = 3;

// 速率限制：每个IP每小时最多发送次数
export const RATE_LIMIT_PER_HOUR = 5;

// ============================================================================
// 验证码生成
// ============================================================================

/**
 * 生成6位数字验证码
 * @returns 6位数字字符串
 */
export function generateVerificationCode(): string {
  const min = 10 ** (VERIFICATION_CODE_LENGTH - 1); // 100000
  const max = 10 ** VERIFICATION_CODE_LENGTH - 1;   // 999999

  const code = randomInt(min, max + 1);
  return code.toString();
}

/**
 * 生成安全的随机验证码（备选方案）
 * @returns 6位数字字符串
 */
export function generateSecureVerificationCode(): string {
  const buffer = randomBytes(3); // 3 bytes = 24 bits
  const codeNum = buffer.readUIntBE(0, 3) % (10 ** VERIFICATION_CODE_LENGTH);
  return codeNum.toString().padStart(VERIFICATION_CODE_LENGTH, '0');
}

// ============================================================================
// 验证码存储
// ============================================================================

export interface StoreVerificationCodeParams {
  email: string;
  code: string;
  purpose: 'register' | 'login' | 'update_email';
  expiresInMinutes?: number;
}

/**
 * 存储验证码到数据库
 * @param params - 存储参数
 */
export async function storeVerificationCode(params: StoreVerificationCodeParams) {
  const { email, code, purpose, expiresInMinutes = VERIFICATION_CODE_EXPIRY_MINUTES } = params;

  const supabase = createAdminClient();

  // 确保 expiresInMinutes 使用最新的默认值（如果传入 undefined）
  const actualExpiresInMinutes = expiresInMinutes || VERIFICATION_CODE_EXPIRY_MINUTES;

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + actualExpiresInMinutes);

  const { error, data } = await supabase
    .from('wmc_email_verification_codes')
    .insert({
      email,
      code,
      purpose,
      expires_at: expiresAt.toISOString(),
    } as any);

  const insertedData = error ? null : data && (data as any)[0];

  if (error) {
    console.error('[Verification] Failed to store verification code:', error);
    throw error;
  }

  console.log('[Verification] Code stored successfully:', {
    email,
    purpose,
    expiresAt: expiresAt.toISOString(),
  });

  return insertedData;
}

// ============================================================================
// 验证码验证
// ============================================================================

export interface VerifyCodeResult {
  valid: boolean;
  reason?: 'invalid_code' | 'expired' | 'max_attempts' | 'used' | 'purpose_mismatch';
  record?: {
    id: string;
    email: string;
    code: string;
    purpose: string;
    attempts: number;
    used: boolean;
    expires_at: string;
  };
}

/**
 * 验证验证码
 * @param email - 用户邮箱
 * @param code - 验证码
 * @param purpose - 验证目的
 * @returns 验证结果
 */
export async function verifyCode(
  email: string,
  code: string,
  purpose: 'register' | 'login' | 'update_email'
): Promise<VerifyCodeResult> {
  const supabase = createAdminClient();

  // 查找匹配的验证码记录
  // 移除 .eq('used', false) 以便此处能区分"无效"和"已使用"
  // 注意：created_at 已确认存在
  const { data: records, error } = await supabase
    .from('wmc_email_verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1);

  const record = records && records.length > 0 ? records[0] as any : null;

  if (error) {
    console.error('[Verification] DB Error:', error);
    return { valid: false, reason: 'invalid_code' };
  }

  if (!record) {
    console.log('[Verification] Code not found:', { email, code, purpose });
    return {
      valid: false,
      reason: 'invalid_code'
    };
  }

  // 🔧 检查是否已使用
  if (record.used) {
    console.log('[Verification] Code already used:', record.id);
    return {
      valid: false,
      reason: 'used'
    };
  }

  // 🔧 检查是否过期
  const now = new Date();
  const expiresAt = new Date(record.expires_at);

  if (expiresAt < now) {
    console.log('[Verification] Code expired:', {
      id: record.id,
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      diff: now.getTime() - expiresAt.getTime()
    });
    return {
      valid: false,
      reason: 'expired'
    };
  }

  // 🔧 检查 purpose 不匹配（仅警告，不阻止验证）
  if (record.purpose !== purpose) {
    console.warn('[Verification] Purpose mismatch:', {
      expected: purpose,
      actual: record.purpose,
      recordId: record.id,
      email: record.email
    });
  }

  // 检查尝试次数
  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    console.log('[Verification] Max attempts reached:', record.id);
    return {
      valid: false,
      reason: 'max_attempts'
    };
  }

  console.log('[Verification] Code is valid:', record.id);

  return {
    valid: true,
    record: record as any
  };
}

// ============================================================================
// 验证码状态更新
// ============================================================================

/**
 * 标记验证码为已使用
 * @param codeId - 验证码记录ID
 */
export async function markCodeAsUsed(codeId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('wmc_email_verification_codes')
    .update({ used: true } as never)
    .eq('id', codeId);

  if (error) {
    console.error('[Verification] Failed to mark code as used:', error);
    throw error;
  }

  console.log('[Verification] Code marked as used:', codeId);
}

/**
 * 增加验证码尝试次数
 * @param codeId - 验证码记录ID
 */
export async function incrementAttempts(codeId: string) {
  const supabase = createAdminClient();

  const { data: records, error: fetchError } = await supabase
    .from('wmc_email_verification_codes')
    .select('attempts')
    .eq('id', codeId)
    .limit(1);

  const current = records && records.length > 0 ? records[0] as any : null;

  if (fetchError) {
    console.error('[Verification] Failed to fetch current attempts:', fetchError);
    throw fetchError;
  }

  if (!current) {
    console.error('[Verification] Code record not found:', codeId);
    throw new Error('Code record not found');
  }

  const { error: updateError } = await supabase
    .from('wmc_email_verification_codes')
    .update({ attempts: current.attempts + 1 } as never)
    .eq('id', codeId);

  if (updateError) {
    console.error('[Verification] Failed to increment attempts:', updateError);
    throw updateError;
  }

  console.log('[Verification] Attempts incremented:', codeId, 'New count:', current.attempts + 1);
}

/**
 * 撤销验证码（如果验证失败）
 * @param codeId - 验证码记录ID
 */
export async function revokeVerificationCode(codeId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('wmc_email_verification_codes')
    .delete()
    .eq('id', codeId);

  if (error) {
    console.error('[Verification] Failed to revoke code:', error);
    throw error;
  }

  console.log('[Verification] Code revoked:', codeId);
}

// ============================================================================
// 清理过期验证码
// ============================================================================

/**
 * 清理所有过期的验证码
 * @returns 清理的记录数量
 */
export async function cleanupExpiredVerificationCodes(): Promise<number> {
  const supabase = createAdminClient();

  const { error, count } = await supabase
    .from('wmc_email_verification_codes')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[Verification] Failed to cleanup expired codes:', error);
    throw error;
  }

  const deletedCount = count || 0;
  console.log('[Verification] Cleaned up expired codes:', deletedCount);

  return deletedCount;
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 生成安全的随机字符串（用于备份方案）
 * @param length - 字符串长度
 * @returns 随机字符串
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const result = [];

  for (let i = 0; i < length; i++) {
    const randomIndex = randomInt(0, chars.length);
    result.push(chars[randomIndex]);
  }

  return result.join('');
}

/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 获取剩余尝试次数
 * @param attempts - 当前尝试次数
 * @returns 剩余次数
 */
export function getRemainingAttempts(attempts: number): number {
  return Math.max(0, MAX_VERIFICATION_ATTEMPTS - attempts);
}

/**
 * 删除特定邮箱的所有验证码（用于测试或安全目的）
 * @param email - 用户邮箱
 */
export async function revokeAllCodesForEmail(email: string) {
  const supabase = createAdminClient();

  const { error, count } = await supabase
    .from('wmc_email_verification_codes')
    .delete()
    .eq('email', email);

  if (error) {
    console.error('[Verification] Failed to revoke all codes for email:', email, error);
    throw error;
  }

  console.log('[Verification] Revoked all codes for email:', email, 'Count:', count || 0);

  return count || 0;
}
