import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware, checkMonthlyLimit, recordProcessing } from "@/lib/rate-limit";

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
    const formData = await request.formData();
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

    // 11. 记录处理历史（用于月度限额统计）
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    recordProcessing(clientIp, image.size, true);

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
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const image = formData.get("image") as File | null;
    if (image) {
      recordProcessing(clientIp, image.size, false);
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
