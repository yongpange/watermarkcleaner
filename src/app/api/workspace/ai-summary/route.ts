import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/workspace/ai-summary
 * 保存 AI 学习笔记到数据库
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取用户信息（可选，支持匿名用户）
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id || null;

    // 2. 解析请求体
    const body = await request.json();
    const { fileId, aiSummary } = body;

    // 3. 验证必填字段
    if (!fileId || !aiSummary) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, aiSummary' },
        { status: 400 }
      );
    }

    // 4. 查找现有的转换记录
    const { data: existing, error: fetchError } = await supabase
      .from('conversions')
      .select('*')
      .eq('file_id', fileId)
      .limit(1)
      .single() as { data: { result: Record<string, unknown> } | null; error: unknown };

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Conversion not found' },
        { status: 404 }
      );
    }

    // 5. 更新转换结果，添加 AI 学习笔记
    const currentResult = existing.result || {};
    const updatedResult = {
      ...currentResult,
      aiSummary,
      aiSummaryGeneratedAt: new Date().toISOString(),
      aiSummaryVersion: ((currentResult.aiSummaryVersion as number) || 0) + 1,
    };

    // 6. 保存到数据库
    const { error: updateError } = await supabase
      .from('conversions')
      .update({
        result: updatedResult,
        user_uuid: userUuid, // 关联用户（如果已登录）
      } as never)
      .eq('file_id', fileId);

    if (updateError) {
      console.error('Update conversion error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save AI summary' },
        { status: 500 }
      );
    }

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'AI summary saved successfully',
      data: {
        fileId,
        aiSummaryGeneratedAt: updatedResult.aiSummaryGeneratedAt,
        aiSummaryVersion: updatedResult.aiSummaryVersion,
      },
    });
  } catch (error) {
    console.error('Save AI summary error:', error);
    return NextResponse.json(
      { error: 'Failed to save AI summary', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/ai-summary?fileId=xxx
 * 从数据库读取 AI 学习笔记
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 获取查询参数
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing fileId parameter' },
        { status: 400 }
      );
    }

    // 2. 从数据库查询
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('conversions')
      .select('*')
      .eq('file_id', fileId)
      .limit(1)
      .single() as { data: { result: Record<string, unknown> } | null; error: unknown };

    if (error || !data) {
      return NextResponse.json(
        { error: 'Conversion not found' },
        { status: 404 }
      );
    }

    const resultData = data.result || {};

    // 3. 返回 AI 学习笔记数据
    return NextResponse.json({
      success: true,
      data: {
        aiSummary: resultData.aiSummary || null,
        aiSummaryGeneratedAt: resultData.aiSummaryGeneratedAt || null,
        aiSummaryVersion: resultData.aiSummaryVersion || 0,
        hasAiSummary: !!resultData.aiSummary,
      },
    });
  } catch (error) {
    console.error('Load AI summary error:', error);
    return NextResponse.json(
      { error: 'Failed to load AI summary', details: (error as Error).message },
      { status: 500 }
    );
  }
}

