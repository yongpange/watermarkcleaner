import { NextRequest, NextResponse } from "next/server";
import { cleanupProcessingHistory, getCleanupStats } from "@/lib/security/cleanup";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * 管理员API：手动触发数据清理
 * GET /api/admin/cleanup
 */

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限（简化版，生产环境应使用更严格的验证）
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) {
      return NextResponse.json(
        { error: "Admin API not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const daysToKeep = daysParam ? parseInt(daysParam, 10) : 3;

    // 执行清理
    const result = await cleanupProcessingHistory(daysToKeep);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 获取清理统计信息
 * POST /api/admin/cleanup
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) {
      return NextResponse.json(
        { error: "Admin API not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 获取统计数据
    const stats = await getCleanupStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
