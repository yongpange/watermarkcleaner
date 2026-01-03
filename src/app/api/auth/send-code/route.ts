import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email/resend';
import { generateVerificationCode, storeVerificationCode, isValidEmail } from '@/lib/auth/verification';
import { createAdminClient } from '@/lib/supabase-admin';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/rate-limit/index';

// ============================================================================
// 配置
// ============================================================================

// 速率限制配置：每个IP每小时最多发送5次验证码
const RATE_LIMIT_WINDOW = 60 * 60; // 1小时（秒）
const RATE_LIMIT_MAX_REQUESTS = 5;

// ============================================================================
// 请求验证
// ============================================================================

interface SendCodeRequest {
  email: string;
  purpose: 'register' | 'login' | 'update_email';
  locale?: string;
}

function validateRequest(body: any): { valid: boolean; data?: SendCodeRequest; error?: string } {
  // 验证邮箱
  if (!body.email || typeof body.email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  if (!isValidEmail(body.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // 验证purpose
  if (!body.purpose || !['register', 'login', 'update_email'].includes(body.purpose)) {
    return { valid: false, error: 'Purpose must be register, login, or update_email' };
  }

  return {
    valid: true,
    data: {
      email: body.email.toLowerCase().trim(),
      purpose: body.purpose,
      locale: body.locale || 'en'
    }
  };
}

// ============================================================================
// API 处理
// ============================================================================

/**
 * POST /api/auth/send-code
 * 发送邮箱验证码
 */
export async function POST(req: NextRequest) {
  try {
    // 获取客户端IP地址
    const ip = await getClientIp();
    const ipHash = Buffer.from(ip).toString('base64'); // 简单的IP哈希

    console.log('[SendCode] Request from IP:', ip, 'Hash:', ipHash);

    // 解析请求体
    let body: any;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[SendCode] Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 验证请求参数
    const validation = validateRequest(body);
    if (!validation.valid) {
      console.log('[SendCode] Invalid request:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { email, purpose, locale } = validation.data!;

    // 速率限制检查（基于IP）
    const rateLimitKey = `send-code:${ipHash}`;
    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW
    );

    if (!rateLimitResult.allowed) {
      console.warn('[SendCode] Rate limit exceeded for IP:', ip);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    console.log('[SendCode] Rate limit check passed.');

    // 检查用户是否存在（根据purpose）
    const supabase = await createAdminClient();

    const { data: existingUser, error: userError } = await supabase
      .from('wmc_users')
      .select('id, email, tier')
      .eq('email', email)
      .limit(1);

    if (userError) {
      console.error('[SendCode] Error checking user existence:', userError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const userExists = existingUser && existingUser.length > 0;

    // 根据purpose验证
    if (purpose === 'register' && userExists) {
      console.log('[SendCode] Email already registered:', email);
      return NextResponse.json(
        { error: 'Email already registered. Please login instead.' },
        { status: 400 }
      );
    }

    if (purpose === 'login' && !userExists) {
      console.log('[SendCode] Email not found:', email);
      return NextResponse.json(
        { error: 'Email not found. Please register first.' },
        { status: 404 }
      );
    }

    // 生成验证码
    const code = generateVerificationCode();
    console.log('[SendCode] Generated code for', email, ':', code);

    // 存储验证码到数据库
    try {
      await storeVerificationCode({
        email,
        code,
        purpose,
        expiresInMinutes: 5
      });
    } catch (error) {
      console.error('[SendCode] Failed to store verification code:', error);
      return NextResponse.json(
        { error: 'Failed to store verification code' },
        { status: 500 }
      );
    }

    // 发送邮件
    const emailResult = await sendVerificationEmail({
      toEmail: email,
      verificationCode: code,
      purpose,
      locale
    });

    if (!emailResult.success) {
      console.error('[SendCode] Failed to send email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    console.log('[SendCode] Email sent successfully:', {
      email,
      purpose,
      emailId: emailResult.data?.id
    });

    // 返回成功响应（不返回验证码）
    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('[SendCode] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 其他API方法（GET/OPTIONS）
// ============================================================================

/**
 * GET /api/auth/send-code
 * 获取速率限制状态（调试用）
 */
export async function GET(_req: NextRequest) {
  try {
    const ip = await getClientIp();
    const ipHash = Buffer.from(ip).toString('base64');
    const rateLimitKey = `send-code:${ipHash}`;

    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW
    );

    return NextResponse.json({
      rateLimit: {
        allowed: rateLimitResult.allowed,
        remaining: Math.max(0, rateLimitResult.remaining),
        totalAllowed: RATE_LIMIT_MAX_REQUESTS
      }
    });
  } catch (error) {
    console.error('[SendCode] Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/auth/send-code
 * 处理预检请求
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
