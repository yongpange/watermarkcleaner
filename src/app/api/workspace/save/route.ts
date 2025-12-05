import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/workspace/save
 * 保存文档到数据库
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取用户信息（可选，支持匿名用户）
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id || null;

    // 2. 解析请求体
    const body = await request.json();
    const { fileId, content, metadata } = body;

    // 3. 验证必填字段
    if (!fileId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, content' },
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

    // 5. 更新转换结果
    const updatedResult = {
      ...existing.result,
      content,
      metadata: {
        ...(existing.result?.metadata as Record<string, unknown> || {}),
        ...metadata,
        lastSaved: new Date().toISOString(),
      },
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
        { error: 'Failed to save document' },
        { status: 500 }
      );
    }

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Document saved successfully',
      data: {
        fileId,
        savedAt: new Date().toISOString(),
        userUuid,
      },
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Failed to save document', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/save?fileId=xxx
 * 从数据库加载文档
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
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // 3. 返回文档数据
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Load error:', error);
    return NextResponse.json(
      { error: 'Failed to load document', details: (error as Error).message },
      { status: 500 }
    );
  }
}

