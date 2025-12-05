import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { randomUUID } from "crypto";
import type {
  FlashcardCreateInput,
  FlashcardBatchSaveRequest,
} from "@/types/flashcard.d";

/**
 * POST /api/flashcards
 * 批量保存闪卡到数据库
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取用户信息（可选，支持匿名用户）
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id || null;

    // 2. 解析请求体
    const body: FlashcardBatchSaveRequest = await request.json();
    const { fileId, flashcards: flashcardsData } = body;

    // 3. 验证必填字段
    if (!fileId || !flashcardsData || !Array.isArray(flashcardsData)) {
      return NextResponse.json(
        { error: "Missing required fields: fileId, flashcards (array)" },
        { status: 400 }
      );
    }

    if (flashcardsData.length === 0) {
      return NextResponse.json(
        { error: "Flashcards array cannot be empty" },
        { status: 400 }
      );
    }

    // 4. 准备数据
    const now = new Date();
    const expiresAt = userUuid
      ? null
      : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24h for anonymous

    const flashcardsToInsert = flashcardsData.map(
      (card: FlashcardCreateInput, index: number) => ({
        uuid: randomUUID(),
        user_uuid: userUuid,
        file_id: fileId,
        question: card.question,
        answer: card.answer,
        explanation: card.explanation || null,
        source: card.source || "ai",
        order: card.order !== undefined ? card.order : index,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        expires_at: expiresAt,
      })
    );

    // 5. 批量插入数据库
    const { data: result, error } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert as never)
      .select();

    if (error) {
      console.error("Insert flashcards error:", error);
      return NextResponse.json(
        { error: "Failed to save flashcards" },
        { status: 500 }
      );
    }

    // 6. 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Flashcards saved successfully",
      data: {
        flashcards: result,
        count: result?.length || 0,
        expiresAt: expiresAt || null,
      },
    });
  } catch (error) {
    console.error("Save flashcards error:", error);
    return NextResponse.json(
      {
        error: "Failed to save flashcards",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/flashcards?fileId=xxx
 * 从数据库加载闪卡列表
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 获取查询参数
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId parameter" },
        { status: 400 }
      );
    }

    // 2. 获取用户信息（可选）
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id || null;

    // 3. 从数据库查询
    const now = new Date().toISOString();

    let query = supabase
      .from("flashcards")
      .select("*")
      .eq("file_id", fileId);

    if (userUuid) {
      // 用户已登录：查询该用户的闪卡
      query = query.eq("user_uuid", userUuid);
    } else {
      // 匿名用户：查询未过期的匿名闪卡
      query = query
        .is("user_uuid", null)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
    }

    const { data: result, error } = await query.order("order", { ascending: true });

    if (error) {
      console.error("Load flashcards error:", error);
      return NextResponse.json(
        { error: "Failed to load flashcards" },
        { status: 500 }
      );
    }

    // 4. 返回闪卡数据
    return NextResponse.json({
      success: true,
      data: {
        flashcards: result || [],
        count: result?.length || 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error("Load flashcards error:", error);
    return NextResponse.json(
      {
        error: "Failed to load flashcards",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

