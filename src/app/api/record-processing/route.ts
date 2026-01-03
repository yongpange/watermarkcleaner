import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getClientIP, hashIPAddress } from "@/lib/security/ip-hash";

/**
 * 记录图片处理历史的专用API端点
 * 使用服务端专用密钥，安全绕过RLS
 */

interface RecordProcessingRequest {
  imageSize: number;
  userId?: string;
  success?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证请求来源（基本防护）
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_WEB_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ].filter(Boolean);

    // 在生产环境中应启用严格的Origin验证
    if (process.env.NODE_ENV === "production" && origin) {
      if (!allowedOrigins.includes(origin)) {
        console.warn("Unauthorized origin:", origin);
        return NextResponse.json(
          { error: "Unauthorized origin" },
          { status: 403 }
        );
      }
    }

    // 2. 获取并解析请求体
    const body: RecordProcessingRequest = await request.json();
    const { imageSize, userId, success = true } = body;

    // 验证必需参数
    if (!imageSize || imageSize <= 0) {
      return NextResponse.json(
        { error: "Invalid imageSize" },
        { status: 400 }
      );
    }

    // 3. 获取客户端IP并哈希处理
    const clientIP = getClientIP(request);
    const hashedIP = hashIPAddress(clientIP);

    // 调试日志
    console.log("IP Processing Debug:", {
      originalIP: clientIP,
      hashedIP: hashedIP,
      userId: userId,
      willStoreIP: !userId
    });

    // 4. 使用admin客户端（Service Role Key）绕过RLS
    // 这是安全的，因为此代码仅在服务器端运行
    const supabase = createAdminClient();

    // 5. 记录处理历史
    const { error } = await supabase.from("wmc_processing_history").insert({
      user_id: userId || null,
      ip_address: userId ? null : hashedIP, // 已登录用户不存储IP哈希
      image_size: imageSize,
      success,
      created_at: new Date().toISOString(),
    } as any);

    if (error) {
      console.error("Failed to record processing history:", error);
      return NextResponse.json(
        { error: "Failed to record processing history", details: error.message },
        { status: 500 }
      );
    }

    // 6. 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: "Processing history recorded successfully",
        hashedIP: userId ? undefined : hashedIP, // 不返回已登录用户的IP哈希
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in record-processing API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
