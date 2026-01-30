import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';
import { getClientIP, hashIPAddress } from '@/lib/security/ip-hash';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { CreditTransactionScene } from '@/extensions/payment/types';

// 配置常量（与真实 API 保持一致）
const CONFIG = {
  // 最大文件大小：20MB
  MAX_FILE_SIZE: 20 * 1024 * 1024,

  // 支持的图片格式
  SUPPORTED_FORMATS: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ] as const,

  // 速率限制（IP级别）
  RATE_LIMIT: {
    MAX_REQUESTS_PER_HOUR: 10, // 每小时最多10次请求
  },

  // 1小时窗口（毫秒）
  WINDOW_MS: 60 * 60 * 1000,
};

/**
 * Mock API 用于测试额度用尽场景
 * 完全模拟真实 API 的输入输出，但不调用真实的 AI 服务
 * 返回原图或轻微修改的模拟结果
 * 重要：会真实扣除额度（调用 deductCredits）并检查额度限制
 * 同时包含速率限制、文件格式验证等真实 API 的所有特性
 */

export async function POST(req: NextRequest) {
  try {
    // 0. 速率限制检查（IP限流）- 与真实 API 保持一致
    const rateLimitResult = await rateLimitMiddleware(req, {
      limit: CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_HOUR,
      windowMs: CONFIG.WINDOW_MS || 3600000,
    });

    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // 添加速率限制信息到日志
    const rateLimitInfo = {
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
    };
    console.log(`[Mock API] Rate limit check passed: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`);

    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const mode = formData.get('mode') as string;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // 1. 文件格式验证（与真实 API 保持一致）
    if (!CONFIG.SUPPORTED_FORMATS.includes(image.type as any)) {
      console.log(`[Mock API] Unsupported file format: ${image.type}`);
      return NextResponse.json(
        {
          error: 'Unsupported file format',
          details: `Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}. Your file: ${image.type}`
        },
        { status: 400 }
      );
    }

    // 2. 文件大小限制（与真实 API 保持一致）
    if (image.size > CONFIG.MAX_FILE_SIZE) {
      console.log(`[Mock API] File too large: ${(image.size / 1024 / 1024).toFixed(2)}MB`);
      return NextResponse.json(
        {
          error: 'File too large',
          details: `Maximum file size: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB. Your file: ${(image.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // 获取用户会话（如果已登录）
    let session: any = null;
    let userId: string | undefined;
    let isAuthenticated = false;
    let userIdentifier: string | undefined;

    try {
      session = await auth();
      // 收紧判定：必须有 user.id 才算 authenticated
      if (session?.user?.id) {
        isAuthenticated = true;
        userId = session.user.id;
        userIdentifier = userId;
        console.log(`[Mock API] Authenticated user: ${userId}`);
      } else {
        // Use IP address for non-authenticated users
        userIdentifier = getClientIP(req);
        console.log(`[Mock API] Guest user (IP: ${userIdentifier})`);
      }
    } catch (_error) {
      // Fallback to IP if session check fails
      userIdentifier = getClientIP(req);
      console.log(`[Mock API] Session check failed, treating as guest (IP: ${userIdentifier})`);
    }

    // 检查用户额度（月度限额）- 在模拟处理之前检查
    try {
      const { checkCredits } = await import('@/lib/credits/check');
      const credits = await checkCredits(userIdentifier ?? 'unknown-ip', isAuthenticated);

      if (!credits.canProcess) {
        console.log(`[Mock API] Credit limit exceeded for user ${userIdentifier}. Used: ${credits.used}/${credits.maxCredits}`);
        return NextResponse.json(
          {
            code: 'CREDIT_LIMIT_EXCEEDED',
            error: "Credit limit exceeded",
            details: `You have used ${credits.used} / ${credits.maxCredits === Infinity ? '∞' : credits.maxCredits} credits`,
            tier: credits.tier,
            used: credits.used,
            limit: credits.maxCredits === Infinity ? '∞' : credits.maxCredits,
            upgradeUrl: credits.tier === 'unverified' ? '/auth/signin' : '/pricing',
          },
          { status: 403 }
        );
      }
      console.log(`[Mock API] Credit check passed. Remaining: ${credits.remaining}/${credits.maxCredits}`);
    } catch (error) {
      console.error('[Mock API] Failed to check credits:', error);
      // Continue with request but log the error
    }

    // 模拟处理延迟（200ms - 2s 随机，模拟真实 API 延迟）
    const delay = Math.random() * 1800 + 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 读取图片信息
    const arrayBuffer = await image.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer); // Edge Runtime compatible
    const originalSize = buffer.length;
    const originalType = image.type;

    console.log(`[Mock API] Processing image:`, {
      name: image.name,
      type: originalType,
      size: originalSize,
      mode: mode,
      authenticated: isAuthenticated,
      userId: userId || 'guest',
      delay: `${delay.toFixed(0)}ms`
    });

    // ===== 关键修复：拆分逻辑，确保 wmc_processing_history 优先写入 =====
    console.log('[Mock API] ===== Processing Complete - Recording History =====');
    console.log('[Mock API] isAuthenticated:', isAuthenticated);
    console.log('[Mock API] userId:', userId || 'N/A (guest)');

    // 第一步：优先写入 wmc_processing_history（lifetime 计数的唯一依据）
    try {
      const adminClient = createAdminClient();
      const ipToHash = userIdentifier || 'unknown-ip';
      const hashedIP = await hashIPAddress(ipToHash);

      console.log('[Mock API] IP Information:');
      console.log('  - Raw IP:', userIdentifier);
      console.log('  - Hash salt (first 10 chars):', process.env.IP_HASH_SALT?.substring(0, 10));
      console.log('  - Hashed IP:', hashedIP);
      console.log('  - Is authenticated:', isAuthenticated);
      console.log('  - Will store IP hash:', !isAuthenticated);

      const recordData = {
        user_id: isAuthenticated && userId ? userId : null,
        ip_address: isAuthenticated && userId ? null : hashedIP,
        image_size: image.size,
        success: true,
        created_at: new Date().toISOString(),
      };

      console.log('[Mock API] Recording to wmc_processing_history:', recordData);

      const { error: recordError } = await (adminClient as any).from("wmc_processing_history").insert(recordData);

      if (recordError) {
        console.error("[Mock API] ❌ Failed to record processing history:", recordError);
        // 这是关键错误，但不阻塞用户
      } else {
        console.log("[Mock API] ✅ Processing history recorded successfully");
        if (!isAuthenticated) {
          console.log("[Mock API] Query this record with:");
          console.log(`  SELECT * FROM wmc_processing_history WHERE ip_address = '${hashedIP}' ORDER BY created_at DESC LIMIT 5;`);
        } else {
          console.log(`  SELECT * FROM wmc_processing_history WHERE user_id = '${userId}' ORDER BY created_at DESC LIMIT 5;`);
        }
      }
    } catch (error) {
      console.error("[Mock API] ❌ Critical: Failed to record processing history:", error);
      // 即使失败也继续，避免阻塞用户
    }

    // 第二步：尝试扣除新 credit 系统额度（单独 try/catch，失败不影响上面的 history 写入）
    if (isAuthenticated && userId) {
      try {
        console.log(`[Mock API] Attempting to consume credits from wmc_credit table for user: ${userId}`);
        const { consumeCredits } = await import('@/lib/models/credit');
        await consumeCredits({
          userId: userId,
          amount: 1,
          scene: CreditTransactionScene.IMAGE_PROCESSING,
          imageSize: originalSize,
        });
        console.log(`[Mock API] ✅ Credit consumed successfully via consumeCredits()`);
      } catch (creditError) {
        console.error("[Mock API] ⚠️ Failed to consume credits (wmc_credit), but processing history already recorded:", creditError);
        // 不阻塞用户，因为 legacy 计数（wmc_processing_history）已经写入成功
      }
    } else {
      console.log('[Mock API] Guest user - skipping wmc_credit deduction (using IP-based wmc_processing_history tracking)');
    }

    console.log('[Mock API] ===== Recording History Completed =====');

    // 生成唯一的 Mock ID
    const mockResultId = uuidv4();

    // 返回模拟的处理结果（匹配前端 ApiResponse 接口）
    return NextResponse.json({
      success: true,
      imageUrl: `/api/mock-seededit/result?id=${mockResultId}`, // 前端期望 imageUrl 字段
      processingTime: delay
    });

  } catch (error) {
    console.error('[Mock API] Error:', error);
    return NextResponse.json(
      { error: 'Mock processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mock-seededit/result?id=<uuid>
 * 返回模拟的处理结果图片
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Result ID required' },
        { status: 400 }
      );
    }

    console.log(`[Mock API] Fetching result: ${id}`);

    // 1x1 transparent PNG as base64
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const binaryString = atob(base64Png);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const transparentPixel = bytes; // Edge Runtime compatible

    return new NextResponse(transparentPixel, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': transparentPixel.length.toString(),
        'X-Mock-Result': 'true',
        'X-Original-ID': id,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[Mock API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 处理 CORS 预检请求
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
