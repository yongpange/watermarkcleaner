import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { randomUUID } from 'crypto';
import type { Database } from '@/types/database.types';

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert'];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * POST /api/workspace/chat-session
 * 保存或更新聊天会话
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取用户信息（可选，支持匿名用户）
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id || null;

    // 2. 解析请求体
    const body = await request.json();
    const { fileId, messages, sessionUuid } = body;

    // 3. 验证必填字段
    if (!fileId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields: fileId, messages (array)' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = userUuid ? null : new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h for anonymous

    // 4. 如果提供了 sessionUuid，更新现有会话
    if (sessionUuid) {
      const { data: existing, error: selectError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('uuid', sessionUuid)
        .limit(1)
        .single() as { data: ChatSession | null; error: unknown };

      if (!selectError && existing) {
        // 更新现有会话
        const { error: updateError } = await supabase
          .from('chat_sessions')
          .update({
            messages: messages as ChatMessage[],
            updated_at: now.toISOString(),
            message_count: messages.length,
            last_message_at: messages.length > 0 ? new Date(messages[messages.length - 1].timestamp).toISOString() : null,
          } as never)
          .eq('uuid', sessionUuid);

        if (updateError) {
          console.error('Update chat session error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update chat session' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Chat session updated successfully',
          data: {
            sessionUuid,
            messageCount: messages.length,
          },
        });
      }
    }

    // 5. 创建新会话
    const newUuid = randomUUID();
    const { error: insertError } = await supabase
      .from('chat_sessions')
      .insert({
        uuid: newUuid,
        user_uuid: userUuid,
        file_id: fileId,
        messages: messages as ChatMessage[],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        expires_at: expiresAt?.toISOString() || null,
        message_count: messages.length,
        last_message_at: messages.length > 0 ? new Date(messages[messages.length - 1].timestamp).toISOString() : null,
      } as never);

    if (insertError) {
      console.error('Insert chat session error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create chat session' },
        { status: 500 }
      );
    }

    // 6. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Chat session created successfully',
      data: {
        sessionUuid: newUuid,
        messageCount: messages.length,
        expiresAt: expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Save chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to save chat session', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/chat-session?fileId=xxx
 * 从数据库读取聊天会话
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 获取查询参数
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const sessionUuid = searchParams.get('sessionUuid');

    if (!fileId && !sessionUuid) {
      return NextResponse.json(
        { error: 'Missing fileId or sessionUuid parameter' },
        { status: 400 }
      );
    }

    // 2. 从数据库查询
    const supabase = await createClient();
    let chatSession: ChatSession | null = null;

    if (sessionUuid) {
      // 通过 sessionUuid 查询
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('uuid', sessionUuid)
        .limit(1)
        .single() as { data: ChatSession | null; error: unknown };

      if (!error && data) {
        chatSession = data;
      }
    } else if (fileId) {
      // 通过 fileId 查询最新的会话
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('file_id', fileId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single() as { data: ChatSession | null; error: unknown };

      if (!error && data) {
        chatSession = data;
      }
    }

    if (!chatSession) {
      return NextResponse.json({
        success: true,
        data: {
          sessionUuid: null,
          messages: [],
          messageCount: 0,
          hasSession: false,
        },
      });
    }

    // 3. 检查是否过期（仅针对匿名用户）
    if (chatSession.expires_at && new Date(chatSession.expires_at) < new Date()) {
      return NextResponse.json({
        success: true,
        data: {
          sessionUuid: null,
          messages: [],
          messageCount: 0,
          hasSession: false,
          expired: true,
        },
      });
    }

    // 4. 返回聊天会话数据
    return NextResponse.json({
      success: true,
      data: {
        sessionUuid: chatSession.uuid,
        messages: chatSession.messages || [],
        messageCount: chatSession.message_count,
        hasSession: true,
        createdAt: chatSession.created_at,
        updatedAt: chatSession.updated_at,
        expiresAt: chatSession.expires_at,
      },
    });
  } catch (error) {
    console.error('Load chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat session', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspace/chat-session?sessionUuid=xxx
 * 删除聊天会话
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. 获取查询参数
    const { searchParams } = new URL(request.url);
    const sessionUuid = searchParams.get('sessionUuid');

    if (!sessionUuid) {
      return NextResponse.json(
        { error: 'Missing sessionUuid parameter' },
        { status: 400 }
      );
    }

    // 2. 删除会话
    const supabase = await createClient();
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('uuid', sessionUuid);

    if (error) {
      console.error('Delete chat session error:', error);
      return NextResponse.json(
        { error: 'Failed to delete chat session' },
        { status: 500 }
      );
    }

    // 3. 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Delete chat session error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session', details: (error as Error).message },
      { status: 500 }
    );
  }
}

