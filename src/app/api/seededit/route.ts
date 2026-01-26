import { NextRequest, NextResponse } from "next/server";

import { Buffer } from "buffer"; // Explicit import for Edge compatibility

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { verifySession } from "@/lib/auth-edge";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { checkUserCredits, USER_TIER_CONFIG } from "@/lib/credits/check-legacy";
import { CreditTransactionScene } from '@/extensions/payment/types';
import { createAdminClient } from "@/lib/supabase-admin";
import { getClientIP, hashIPAddress } from "@/lib/security/ip-hash";
import { consumeCredits } from '@/lib/models/credit';

// 字节跳动方舟API配置
const ARK_API_URL = process.env.ARK_API_URL || "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const ARK_API_KEY = process.env.ARK_API_KEY;

import { getFeaturePrompt } from "@/lib/prompts";

// ... (imports)

// 配置常量
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

  // ... (GUIDANCE_SCALE, RATE_LIMIT, etc. remain unchanged)
  // guidance_scale配置
  GUIDANCE_SCALE: {
    auto: 5.5,        // 自动模式，平衡质量和速度
    conservative: 4.5, // 保守模式：避免过度处理
    aggressive: 6.5,   // 激进模式：确保水印完全移除
  } as const,

  // 速率限制（IP级别）
  RATE_LIMIT: {
    MAX_REQUESTS_PER_HOUR: 10,  // 每小时最多10次请求
    MAX_UNVERIFIED_PER_MONTH: 3,  // 未验证用户每月最多3张
  },

  // 1小时窗口（毫秒）
  WINDOW_MS: 60 * 60 * 1000,
};

// 类型定义
interface ArkApiRequest {
  model: string;
  prompt: string;
  image: string; // base64 data URL
  response_format: "url";
  size?: string;
  width?: number; // Added for Doubao Seedream 4.0 compatibility
  height?: number; // Added for Doubao Seedream 4.0 compatibility
  seed?: number;
  guidance_scale: number;
  watermark: boolean;
}

interface ArkApiResponse {
  model: string;
  created: number;
  data: Array<{
    url: string;
  }>;
  usage: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
}

/**
 * 将File/Blob转换为base64 data URL (Node.js optimized)
 */
async function fileToDataUrl(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 获取处理模式的guidance_scale
 */
function getGuidanceScale(mode: string = "auto"): number {
  return CONFIG.GUIDANCE_SCALE[mode as keyof typeof CONFIG.GUIDANCE_SCALE] || CONFIG.GUIDANCE_SCALE.auto;
}

/**
 * 构建处理prompt
 */
function buildPrompt(mode: string = "auto", customPrompt?: string, feature: string = "watermark"): string {
  if (customPrompt) {
    return customPrompt;
  }

  const lang = "en"; // 可以根据需求切换
  const basePrompt = getFeaturePrompt(feature, lang);

  // Mode modifiers mainly apply to watermark removal, but we can keep them or adapt
  if (feature === 'watermark') {
    if (mode === "conservative") {
      return `[Conservative Mode] ${basePrompt} Only remove obvious watermarks and keep all other content unchanged.`;
    } else if (mode === "aggressive") {
      return `[Aggressive Mode] ${basePrompt} Thoroughly remove all traces of watermarks, including semi-transparent and hidden marks.`;
    }
  }

  return basePrompt;
}



/**
 * Normalize image dimensions to meet API requirements
 * - Minimum area: 1024x1024 (approx 1M pixels)
 * - Maximum area: 4096*4096 (approx 16M pixels)
 * - Snap to multiples of 64 (safer for SDXL-based models)
 * - Preserve aspect ratio as closely as possible
 */
function normalizeSize(width: number, height: number): { width: number, height: number } {
  const MIN_AREA = 1024 * 1024;
  const MAX_AREA = 4096 * 4096; // Conservative max
  const SNAP = 64;

  let newWidth = width;
  let newHeight = height;
  let currentArea = newWidth * newHeight;

  // 1. Scale Up if too small
  if (currentArea < MIN_AREA) {
    const scale = Math.sqrt(MIN_AREA / currentArea);
    newWidth = Math.ceil(newWidth * scale);
    newHeight = Math.ceil(newHeight * scale);
  }

  // 2. Scale Down if too large
  currentArea = newWidth * newHeight;
  if (currentArea > MAX_AREA) {
    const scale = Math.sqrt(MAX_AREA / currentArea);
    newWidth = Math.floor(newWidth * scale);
    newHeight = Math.floor(newHeight * scale);
  }

  // 3. Snap to multiples of SNAP (32 or 64)
  // Use round to get closest multiple
  newWidth = Math.round(newWidth / SNAP) * SNAP;
  newHeight = Math.round(newHeight / SNAP) * SNAP;

  // Ensure non-zero
  newWidth = Math.max(SNAP, newWidth);
  newHeight = Math.max(SNAP, newHeight);

  console.log(`[Resolution Normalize] Input: ${width}x${height} -> Output: ${newWidth}x${newHeight}`);
  return { width: newWidth, height: newHeight };
}

export async function POST(request: NextRequest) {
  // 格式化当前时间的辅助函数
  const getTimestamp = () => new Date().toISOString();

  // 添加 [SeedEdit API] 前缀的日志函数
  const logInfo = (message: string, data?: any) => {
    console.log(`[SeedEdit API] [${getTimestamp()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  };

  const logError = (message: string, error?: any) => {
    console.error(`[SeedEdit API] [${getTimestamp()}] ${message}`, error);
  };

  logInfo('========== NEW REQUEST STARTED ==========');
  logInfo('Request headers:', Object.fromEntries(request.headers.entries()));
  console.log('[DEBUG-URGENT] Raw Cookie Header:', request.headers.get('cookie'));

  // 0. 速率限制检查（IP限流）
  logInfo('Step 0: Checking rate limit...', {
    maxRequests: CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_HOUR,
    windowMs: CONFIG.WINDOW_MS
  });
  const rateLimitResult = await rateLimitMiddleware(request, {
    limit: CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_HOUR,
    windowMs: CONFIG.WINDOW_MS || 3600000,
  });

  if (!rateLimitResult.allowed && rateLimitResult.response) {
    logInfo('Rate limit exceeded:', {
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      resetTime: new Date(rateLimitResult.resetTime).toISOString()
    });
    return rateLimitResult.response;
  }

  logInfo('Rate limit check passed:', {
    limit: rateLimitResult.limit,
    remaining: rateLimitResult.remaining,
    resetTime: new Date(rateLimitResult.resetTime).toISOString()
  });

  // 添加速率限制信息到响应头（如果请求成功）
  const rateLimitInfo = {
    limit: rateLimitResult.limit,
    remaining: rateLimitResult.remaining,
    resetTime: rateLimitResult.resetTime,
  };

  // 获取用户会话（如果已登录）
  let session: any = null;
  let userIdentifier: string;
  let isAuthenticated = false;
  let userId: string | undefined;
  let formData: FormData | null = null;

  logInfo('Step 1: Authenticating user...');
  try {
    const verifyResult = await verifySession(request);
    session = verifyResult.session;
    logInfo('Session retrieved:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    // 收紧判定：必须有 user.id 才算 authenticated
    if (session?.user?.id) {
      isAuthenticated = true;
      userId = session.user.id;
      userIdentifier = userId as string;
      logInfo('User authenticated:', { userId: userIdentifier });
    } else {
      userIdentifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
      logInfo('Guest user detected:', { ipAddress: userIdentifier });
    }
  } catch (_error) {
    logError('Session authentication failed:', _error);
    userIdentifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
  }

  // Get raw IP for credit check consistency
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";

  // 1.5 CHECK CREDITS (Strict Check)
  logInfo('Step 1.5: Checking user credits...', { isAuthenticated, userId, clientIp });
  try {
    const creditStatus = await checkUserCredits(clientIp, isAuthenticated, userId, clientIp);
    
    logInfo('Credit check result:', creditStatus);

    if (creditStatus.remaining <= 0) {
      logInfo('❌ Credit Limit Exceeded:', { 
        ident: isAuthenticated ? userId : clientIp,
        remaining: creditStatus.remaining 
      });
      
      return NextResponse.json(
        { 
          error: "Credit limit exceeded", 
          code: "CREDIT_LIMIT_EXCEEDED",
          details: isAuthenticated 
            ? "You have used all your credits. Please upgrade to Pro." 
            : "Free trial limit reached. Please sign in or upgrade for more."
        },
        { status: 403 }
      );
    }
  } catch (err) {
    logError('Failed to check credits:', err);
    // Optional: Fail open or closed? Failing open might be safer for UX if DB is down, but failing closed safer for business.
    // Choosing to log but proceed if check fails, to avoid blocking users on system glitches (or return 500).
    // return NextResponse.json({ error: "System error checking credits" }, { status: 500 });
  }

  // 2. 解析form data (Move up to allow access to image size for failure recording)
  logInfo('Step 2: Parsing FormData...');
  try {
    formData = await request.formData();
    const image = formData.get("image") as File | null;
    const mode = (formData.get("mode") as string) || "auto";
    const feature = (formData.get("feature") as string) || "watermark";
    const customPrompt = formData.get("prompt") as string | null;
    // Get size from formData, default to 1024x1024 if invalid or missing
    const targetSize = (formData.get("size") as string) || "1024x1024";

    // 3. 验证输入
    if (!image) {
      logError('No image file in FormData');
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    logInfo('FormData parsed successfully:', {
      imageName: image.name,
      imageSize: image.size,
      imageType: image.type,
      mode,
      feature,
      hasCustomPrompt: !!customPrompt
    });

    // ... (intermediate validation code omitted for brevity check file content to ensure continuity)

    // 7. 构建请求参数
    logInfo('Step 8: Building AI request parameters...');
    const imageDataUrl = await fileToDataUrl(image); // Restore missing definition
    const prompt = buildPrompt(mode, customPrompt ?? undefined, feature);
    const guidanceScale = getGuidanceScale(mode);

    // Calculate width and height from targetSize string (New logic for Doubao compatibility)
    const [rawWidth, rawHeight] = targetSize.split('x').map(Number);
    let desiredWidth = rawWidth || 1024;
    let desiredHeight = rawHeight || 1024;

    // Normalize size to be safe for API (multiples of 64, min area 1024x1024)
    // This fixes issues where small non-standard inputs (e.g. 1000x660) get rejected or defaulted to 1:1
    const { width, height } = normalizeSize(desiredWidth, desiredHeight);

    logInfo('AI request parameters built:', {
      mode,
      guidanceScale,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      targetSize,
      rawInput: `${desiredWidth}x${desiredHeight}`,
      normalizedOutput: `${width}x${height}`,
      hasCustomPrompt: !!customPrompt
    });

    // 8. 调用字节方舟API
    const startTime = Date.now();
    logInfo('Step 9: Calling ByteDance Ark AI API...', {
      apiUrl: ARK_API_URL,
      model: 'doubao-seedream-4-0-250828',
      timestamp: new Date(startTime).toISOString()
    });

    // Construct the request payload
    // Use 'size' string format "WIDTHxHEIGHT" as this is the standard OpenAI-compatible format
    // and likely what the API expects for custom resolutions.
    const normalizedSizeStr = `${width}x${height}`;

    const requestPayload: ArkApiRequest = {
      model: "doubao-seedream-4-0-250828",
      prompt: prompt,
      image: imageDataUrl,
      response_format: "url",
      size: normalizedSizeStr, 
      guidance_scale: guidanceScale,
      seed: Math.floor(Math.random() * 1000000), // 随机种子
      watermark: false, // 不添加API水印
    };

    logInfo('AI API request body prepared (preview):', {
      model: requestPayload.model,
      promptLength: prompt.length,
      hasImage: !!imageDataUrl,
      width,
      height,
      guidanceScale,
      watermark: false
    });

    const response = await fetch(ARK_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ARK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      // 设置超时（120秒）
      signal: AbortSignal.timeout(120000),
    });

    logInfo('AI API response received:', {
      status: response.status,
      statusText: response.statusText,
      requestId: response.headers.get('x-request-id'),
      ok: response.ok
    });

    // 9. 处理响应
    if (!response.ok) {
      const errorText = await response.text();
      logError('AI API error response:', {
        status: response.status,
        statusText: response.statusText,
        requestId: response.headers.get('x-request-id'),
        errorBody: errorText,
        rawResponse: response
      });

      // 根据状态码返回不同的错误信息
      if (response.status === 401) {
        logError('AI API authentication failed - invalid API key');
        return NextResponse.json(
          { error: "Authentication failed. Invalid API key" },
          { status: 401 }
        );
      } else if (response.status === 429) {
        logError('AI API rate limit exceeded');
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later" },
          { status: 429 }
        );
      } else if (response.status >= 500) {
        logError('AI API server error:', response.status);
        return NextResponse.json(
          { error: "AI processing service temporarily unavailable" },
          { status: 503 }
        );
      }

      logError(`AI API error: ${response.statusText}`);
      return NextResponse.json(
        { error: `API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    logInfo('AI API response OK, parsing JSON...');
    const data = (await response.json()) as ArkApiResponse;
    const processingTime = Date.now() - startTime;

    logInfo('AI API response parsed:', {
      processingTime: `${processingTime}ms`,
      tokens: data.usage,
      hasImageUrl: !!data.data?.[0]?.url,
      imageUrl: data.data?.[0]?.url,
      model: data.model,
      created: data.created,
      fullResponse: data
    });

    // 10. 验证返回数据
    if (!data.data?.[0]?.url) {
      logError('AI API response is missing image URL:', data);
      return NextResponse.json(
        { error: "Invalid response from AI service: no image URL", details: data },
        { status: 500 }
      );
    }

    logInfo('AI processing successful, preparing response');

    // 第一步：优先写入 wmc_processing_history（lifetime 计数的唯一依据）
    logInfo('Step 10: Recording processing history (wmc_processing_history)...');

    try {
      const adminClient = createAdminClient();
      const clientIP = getClientIP(request);
      const ipToHash = clientIP || 'unknown-ip';
      const hashedIP = await hashIPAddress(ipToHash);

      logInfo('IP information:', {
        rawIP: clientIP,
        hashSalt: process.env.IP_HASH_SALT?.substring(0, 10) + '...',
        hashedIP,
        isAuthenticated,
        willStoreIP: !isAuthenticated // This comment might be outdated if IP is always stored
      });

      const recordData = {
        user_id: isAuthenticated && userId ? userId : null,
        ip_address: hashedIP, // Always record IP address for credit tracking
        image_size: image.size,
        success: true,
        created_at: new Date().toISOString(),
      };

      logInfo('Inserting processing history record:', recordData);

      const { error: recordError } = await (adminClient as any).from("wmc_processing_history").insert(recordData);

      if (recordError) {
        logError('❌ Failed to record processing history:', recordError);
      } else {
        logInfo('✅ Processing history recorded successfully');
        if (!isAuthenticated) {
          logInfo('Query IP records:', `SELECT * FROM wmc_processing_history WHERE ip_address = '${hashedIP}' ORDER BY created_at DESC LIMIT 5;`);
        } else {
          logInfo('Query user records:', `SELECT * FROM wmc_processing_history WHERE user_id = '${userId}' ORDER BY created_at DESC LIMIT 5;`);
        }
      }
    } catch (error) {
      logError('Critical: Failed to record processing history:', error);
    }

    // 第二步：尝试扣除新 credit 系统额度（单独 try/catch，失败不影响上面的 history 写入）
    if (isAuthenticated && userId) {
      logInfo('Step 11: Consuming credits from wmc_credit table...', { userId });
      try {
        await consumeCredits({
          userId: userId,
          amount: 1,
          scene: CreditTransactionScene.IMAGE_PROCESSING,
          imageSize: image.size,
        });
        logInfo('✅ Credit consumed successfully via consumeCredits()');
      } catch (creditError) {
        logError('⚠️ Failed to consume credits (wmc_credit), but processing history already recorded:', creditError);
      }
    } else {
      logInfo('Guest user - skipping wmc_credit deduction');
    }

    logInfo('========== REQUEST COMPLETED SUCCESSFULLY ==========');

    // 返回结果（包含速率限制信息）
    logInfo('Preparing final response:', {
      success: true,
      imageUrl: data.data[0].url,
      processingTime,
      tokensUsed: data.usage,
      metadata: {
        originalSize: image.size,
        originalType: image.type,
        originalName: image.name,
        mode,
      },
      rateLimit: {
        limit: rateLimitInfo.limit,
        remaining: Math.max(0, rateLimitInfo.remaining - 1),
        resetTime: rateLimitInfo.resetTime,
      }
    });

    return NextResponse.json(
      {
        success: true,
        imageUrl: data.data[0].url,
        processingTime,
        tokensUsed: data.usage,
        metadata: {
          originalSize: image.size,
          originalType: image.type,
          originalName: image.name,
          mode,
        },
        // 添加速率限制信息
        rateLimit: {
          limit: rateLimitInfo.limit,
          remaining: Math.max(0, rateLimitInfo.remaining - 1), // 减去本次消耗
          resetTime: rateLimitInfo.resetTime,
        },
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": String(rateLimitInfo.limit),
          "X-RateLimit-Remaining": String(Math.max(0, rateLimitInfo.remaining - 1)),
          "X-RateLimit-Reset": String(rateLimitInfo.resetTime),
        },
      }
    );

  } catch (error) {
    // 13. 错误处理
    logError('========== REQUEST FAILED ==========', error);

    // 记录失败的请求（如果有图片信息）
    logInfo('Attempting to record failed processing history...');
    try {
      if (formData) {
        const image = formData.get("image") as File | null;
        if (image) {
          const adminClient = createAdminClient();
          const clientIP = getClientIP(request);
          const hashedIP = await hashIPAddress(clientIP);

          logInfo('Recording failed processing:', {
            userId: userId || null, // Use userId if it exists
            ip: hashedIP,
            imageSize: image.size,
            isAuthenticated // Log this for debugging
          });

          await (adminClient as any).from("wmc_processing_history").insert({
            user_id: userId || null,
            ip_address: hashedIP, // Always record IP even for failed requests
            image_size: image.size,
            success: false,
            created_at: new Date().toISOString(),
          });
          logInfo('✅ Failed processing recorded to wmc_processing_history');
        }
      }
    } catch (recordError) {
      logError('Failed to record failed processing:', recordError);
    }

    // 处理超时错误
    if (error instanceof Error) {
      logError('Error type:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        logInfo('Request timeout detected, returning 504');
        return NextResponse.json(
          {
            error: "Request timeout",
            details: "Image processing took too long. This might be due to:\n1. Large image size\n2. High server load\n3. Complex image content\n\nPlease try again with a smaller image (max 2000x2000) or wait a moment and retry."
          },
          { status: 504 }
        );
      }

      logInfo('Returning 500 error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    logInfo('Unknown error type, returning 500');
    return NextResponse.json(
      { error: "An unknown error occurred during processing" },
      { status: 500 }
    );
  }
}
