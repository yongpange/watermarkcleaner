import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Database } from '@/types/database.types';
import {
  verifyCode,
  markCodeAsUsed,
  incrementAttempts,
  VerifyCodeResult
} from '@/lib/auth/verification';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

type UserInsert = Database['public']['Tables']['wmc_users']['Insert'];

// ============================================================================
// 请求验证
// ============================================================================

interface VerifyCodeRequest {
  email: string;
  code: string;
  purpose: 'register' | 'login' | 'update_email';
}

function validateRequest(body: any): { valid: boolean; data?: VerifyCodeRequest; error?: string } {
  // 验证邮箱
  if (!body.email || typeof body.email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // 验证验证码
  if (!body.code || typeof body.code !== 'string') {
    return { valid: false, error: 'Verification code is required' };
  }

  if (body.code.length !== 6 || !/^\d+$/.test(body.code)) {
    return { valid: false, error: 'Invalid verification code format' };
  }

  // 验证purpose
  if (!body.purpose || !['register', 'login', 'update_email'].includes(body.purpose)) {
    return { valid: false, error: 'Purpose must be register, login, or update_email' };
  }

  return {
    valid: true,
    data: {
      email: body.email.toLowerCase().trim(),
      code: body.code,
      purpose: body.purpose
    }
  };
}

// ============================================================================
// API 处理
// ============================================================================

/**
 * POST /api/auth/verify-code
 * 验证验证码并完成注册/登录
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    let body: any;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[VerifyCode] Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 验证请求参数
    const validation = validateRequest(body);
    if (!validation.valid) {
      console.log('[VerifyCode] Invalid request:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { email, code, purpose } = validation.data!;

    console.log('[VerifyCode] Verifying code for', email, 'purpose:', purpose);

    // 验证验证码
    const result: VerifyCodeResult = await verifyCode(email, code, purpose);

    if (!result.valid) {
      console.log('[VerifyCode] Verification failed:', result.reason);

      // 如果验证码存在但无效，增加尝试次数
      if (result.record?.id && result.reason !== 'invalid_code') {
        try {
          await incrementAttempts(result.record.id);
        } catch (error) {
          console.error('[VerifyCode] Failed to increment attempts:', error);
        }
      }

      const errorMessages = {
        invalid_code: 'Invalid verification code',
        expired: 'Verification code has expired',
        max_attempts: 'Maximum verification attempts reached',
        used: 'Verification code has already been used',
        purpose_mismatch: 'Invalid verification purpose'
      };

      return NextResponse.json(
        {
          error: errorMessages[result.reason || 'invalid_code'],
          reason: result.reason
        },
        { status: 400 }
      );
    }

    console.log('[VerifyCode] Verification successful:', result.record?.id);

    const supabase = createAdminClient();

    // 根据purpose处理
    if (purpose === 'register') {
      // 检查用户是否已存在（双重检查）
      const { data: existingUser } = await supabase
        .from('wmc_users')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        console.log('[VerifyCode] User already exists during registration:', email);

        // 标记验证码为已使用
        if (result.record?.id) {
          await markCodeAsUsed(result.record.id);
        }

        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      // 生成用户名（从邮箱前缀）
      const usernameBase = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

      // 检查用户名是否唯一
      let username = usernameBase;
      let counter = 0;
      const maxAttempts = 10;

      while (counter < maxAttempts) {
        const { data: existingUserByUsername } = await supabase
          .from('wmc_users')
          .select('id')
          .eq('username', username)
          .limit(1);

        if (!existingUserByUsername || existingUserByUsername.length === 0) {
          break;
        }

        // 用户名已存在，添加后缀
        counter++;
        username = `${usernameBase}_${counter}`;
      }

      if (counter >= maxAttempts) {
        console.error('[VerifyCode] Failed to generate unique username');
        return NextResponse.json(
          { error: 'Failed to generate username' },
          { status: 500 }
        );
      }

      console.log('[VerifyCode] Generated username:', username);

      // 创建新用户
      const userId = crypto.randomUUID();
      const { error: createError } = await supabase
        .from('wmc_users')
        .insert({
          id: userId,
          email,
          name: username, // name 字段是标准的 NextAuth 字段
          tier: 'verified', // 邮箱验证后直接设为 verified
        } as any);

      if (createError) {
        console.error('[VerifyCode] Failed to create user:', createError);

        // 尝试特定的错误处理
        if (createError.code === '23505') { // 唯一键冲突
          return NextResponse.json(
            { error: 'Username already taken. Please try again.' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      console.log('[VerifyCode] User created successfully:', userId);

      // 标记验证码为已使用
      if (result.record?.id) {
        await markCodeAsUsed(result.record.id);
      }

      // 返回成功响应（包含用户数据）
      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        user: {
          id: userId,
          email,
          username,
          tier: 'verified'
        },
        // 前端需要调用 next-auth 的 signIn 方法完成登录
        requiresSignIn: true
      });

    } else if (purpose === 'login') {
      // 查找用户
      const { data: users, error: userError } = await supabase
        .from('wmc_users')
        .select('*')
        .eq('email', email)
        .limit(1) as any;

      if (userError || !users || users.length === 0) {
        console.log('[VerifyCode] User not found during login:', email);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];
      console.log('[VerifyCode] User found for login:', user.id);

      // 标记验证码为已使用
      if (result.record?.id) {
        await markCodeAsUsed(result.record.id);
      }

      // 返回成功响应（包含用户数据）
      return NextResponse.json({
        success: true,
        message: 'Verification successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          tier: user.tier
        },
        // 前端需要调用 next-auth 的 signIn 方法完成登录
        requiresSignIn: true
      });

    } else if (purpose === 'update_email') {
      // 邮箱修改验证
      // 标记验证码为已使用
      if (result.record?.id) {
        await markCodeAsUsed(result.record.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Email verification successful',
        // 前端需要调用另一个API来实际更新邮箱
        requiresEmailUpdate: true
      });
    }

  } catch (error) {
    console.error('[VerifyCode] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/auth/verify-code
 * 处理预检请求（CORS）
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
