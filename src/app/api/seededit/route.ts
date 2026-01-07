import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { checkUserCredits, deductCredits, recordProcessingHistory, USER_TIER_CONFIG } from "@/lib/credits/check";

// 字节跳动方舟API配置
const ARK_API_URL = process.env.ARK_API_URL || "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const ARK_API_KEY = process.env.ARK_API_KEY;

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

  // 默认的prompt
  DEFAULT_PROMPT: {
    zh: "移除图片中的所有水印、文字覆盖层、logo和版权标记。使用上下文感知修复技术无缝恢复原始背景。保持原始图像质量、颜色和纹理。让结果看起来像从未添加过水印。",
    en: "Remove all watermarks, text overlays, logos, and copyright marks from this image. Restore the original background seamlessly using context-aware inpainting. Maintain the original image quality, colors, and textures. Make the result look as if no watermark was ever present.",
  },

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
  size: "adaptive";
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
 * 将File/Blob转换为base64 data URL
 */
async function fileToDataUrl(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
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
function buildPrompt(mode: string = "auto", customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt;
  }

  const lang = "en"; // 可以根据需求切换
  const basePrompt = CONFIG.DEFAULT_PROMPT[lang as keyof typeof CONFIG.DEFAULT_PROMPT];

  if (mode === "conservative") {
    return `[Conservative Mode] ${basePrompt} Only remove obvious watermarks and keep all other content unchanged.`;
  } else if (mode === "aggressive") {
    return `[Aggressive Mode] ${basePrompt} Thoroughly remove all traces of watermarks, including semi-transparent and hidden marks.`;
  }

  return basePrompt;
}

export async function POST(request: NextRequest) {
  // 0. 速率限制检查（IP限流）
  const rateLimitResult = await rateLimitMiddleware(request, {
    limit: CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_HOUR,
    windowMs: CONFIG.WINDOW_MS || 3600000,
  });

  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

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

  try {
    session = await auth();
    if (session?.user) {
      isAuthenticated = true;
      userId = session.user.id;
      userIdentifier = userId || "authenticated-user";
    } else {
      // Use IP address for non-authenticated users
      userIdentifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
    }
  } catch (_error) {
    // Fallback to IP if session check fails
    userIdentifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
  }

  // 检查用户额度（月度限额）
  try {
    const credits = await checkUserCredits(userIdentifier, isAuthenticated, userId);

    if (credits.remaining <= 0) {
      const tierConfig = USER_TIER_CONFIG[credits.tier];
      return NextResponse.json(
        {
          code: 'CREDIT_LIMIT_EXCEEDED',
          error: "Credit limit exceeded",
          details: `You have used ${credits.used} / ${tierConfig.maxPerMonth === Infinity ? '∞' : tierConfig.maxPerMonth} credits`,
          tier: credits.tier,
          used: credits.used,
          limit: tierConfig.maxPerMonth === Infinity ? '∞' : tierConfig.maxPerMonth,
          upgradeUrl: credits.tier === "unverified" ? "/auth/signin" : "/pricing",
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Failed to check credits:", error);
    // Continue with request but log the error
  }

  // 1. 验证API密钥配置
  if (!ARK_API_KEY) {
    console.error("ARK_API_KEY is not configured");
    return NextResponse.json(
      {
        error: "Server configuration error: ARK_API_KEY is not set",
        details: "Please contact the administrator to configure the API key"
      },
      { status: 500 }
    );
  }

  try {
    // 2. 解析form data
    formData = await request.formData();
    const image = formData.get("image") as File | null;
    const mode = (formData.get("mode") as string) || "auto";
    const customPrompt = formData.get("prompt") as string | null;

    // 3. 验证输入
    if (!image) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // 4. 验证文件类型
    if (!CONFIG.SUPPORTED_FORMATS.includes(image.type as any)) {
      return NextResponse.json(
        {
          error: "Unsupported file format",
          details: `Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(", ")}. Your file: ${image.type}`
        },
        { status: 400 }
      );
    }

    // 5. 验证文件大小
    if (image.size > CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          details: `Maximum file size: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB. Your file: ${(image.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // 6. 转换图片为data URL
    console.log("Converting image to data URL...");
    const imageDataUrl = await fileToDataUrl(image);
    console.log("Image converted", {
      size: image.size,
      type: image.type,
      dataUrlLength: imageDataUrl.length
    });

    // 7. 构建请求参数
    const prompt = buildPrompt(mode, customPrompt || undefined);
    const guidanceScale = getGuidanceScale(mode);

    console.log("Processing with params:", {
      mode,
      guidanceScale,
      promptLength: prompt.length,
      hasCustomPrompt: !!customPrompt
    });

    // 8. 调用字节方舟API
    console.log("Calling Ark API...");
    const startTime = Date.now();

    const response = await fetch(ARK_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ARK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "doubao-seededit-3-0-i2i-250628",
        prompt: prompt,
        image: imageDataUrl,
        response_format: "url",
        size: "adaptive", // 保持原图尺寸
        guidance_scale: guidanceScale,
        seed: Math.floor(Math.random() * 1000000), // 随机种子
        watermark: false, // 不添加API水印
      } as ArkApiRequest),

      // 设置超时（120秒）
      signal: AbortSignal.timeout(120000),
    });

    // 9. 处理响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ark API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      // 根据状态码返回不同的错误信息
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed. Invalid API key" },
          { status: 401 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later" },
          { status: 429 }
        );
      } else if (response.status >= 500) {
        return NextResponse.json(
          { error: "AI processing service temporarily unavailable" },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as ArkApiResponse;
    const processingTime = Date.now() - startTime;

    console.log("Ark API call successful", {
      processingTime: `${processingTime}ms`,
      tokens: data.usage,
      imageUrl: data.data[0]?.url,
    });

    // 10. 验证返回数据
    if (!data.data?.[0]?.url) {
      console.error("No image URL in response:", data);
      return NextResponse.json(
        { error: "Invalid response from AI service: no image URL", details: data },
        { status: 500 }
      );
    }

    // 11. 扣除额度（对已认证用户）并记录处理历史
    try {
      console.log('[SeedEdit API] ===== Processing Complete - Recording History =====');
      console.log('[SeedEdit API] isAuthenticated:', isAuthenticated);
      console.log('[SeedEdit API] userId:', userId || 'N/A (guest)');

      // Deduct credit for authenticated users
      if (isAuthenticated && userId) {
        console.log(`[SeedEdit API] Deducting credits for authenticated user: ${userId}`);
        await deductCredits(userId);
        console.log(`[SeedEdit API] Credits deducted via deductCredits()`);
      } else {
        console.log('[SeedEdit API] Guest user - skipping credit deduction (IP-based tracking)');
      }

      // 记录处理历史 - 直接使用 Admin Client 写入数据库
      // 这是安全的，因为此代码在服务端运行
      const { createAdminClient } = await import("@/lib/supabase-admin");
      const { getClientIP, hashIPAddress } = await import("@/lib/security/ip-hash");

      const adminClient = createAdminClient();

      // Standardize usage of getClientIP for consistency
      const clientIP = getClientIP(request);
      const ipToHash = clientIP || 'unknown-ip';
      const hashedIP = hashIPAddress(ipToHash);

      console.log('[SeedEdit API] IP Information:');
      console.log('  - Raw IP:', clientIP);
      console.log('  - Hash salt (first 10 chars):', process.env.IP_HASH_SALT?.substring(0, 10));
      console.log('  - Hashed IP:', hashedIP);
      console.log('  - Is authenticated:', isAuthenticated);
      console.log('  - Will store IP hash:', !isAuthenticated);

      const recordData = {
        user_id: isAuthenticated ? userId : null,
        ip_address: isAuthenticated ? null : hashedIP,
        image_size: image.size,
        success: true,
        created_at: new Date().toISOString(),
      };

      console.log('[SeedEdit API] Recording to wmc_processing_history:', recordData);

      const { error: recordError } = await (adminClient as any).from("wmc_processing_history").insert(recordData);

      if (recordError) {
        console.error("[SeedEdit API] Failed to record processing history:", recordError);
        // 继续执行，不阻塞用户
      } else {
        console.log("[SeedEdit API] Processing history recorded successfully");
        console.log("[SeedEdit API] Query this record with:");
        console.log(`  SELECT * FROM wmc_processing_history WHERE ip_address = '${hashedIP}'`);
      }

      console.log('[SeedEdit API] ===== Recording History Completed =====');
    } catch (error) {
      console.error("[SeedEdit API] Failed to record processing/deduct credits:", error);
      // Continue even if recording fails - we don't want to block the user
    }

    // 12. 返回结果（包含速率限制信息）
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
    console.error("Processing error:", error);

    // 记录失败的请求（如果有图片信息）
    try {
      if (formData) {
        const image = formData.get("image") as File | null;
        if (image) {
          await recordProcessingHistory({
            identifier: userIdentifier,
            imageSize: image.size,
            userId: isAuthenticated ? userId : undefined,
            success: false,
          });
        }
      }
    } catch (recordError) {
      console.error("Failed to record failed processing:", recordError);
    }

    // 处理超时错误
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          {
            error: "Request timeout",
            details: "Image processing took too long. This might be due to:\n1. Large image size\n2. High server load\n3. Complex image content\n\nPlease try again with a smaller image (max 2000x2000) or wait a moment and retry."
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred during processing" },
      { status: 500 }
    );
  }
}
