import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { FlashcardUpdateInput } from "@/types/flashcard.d";
import type { Database } from "@/types/database.types";

type Flashcard = Database['public']['Tables']['flashcards']['Row'];

/**
 * PUT /api/flashcards/[uuid]
 * 更新闪卡内容
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    // 1. 获取用户信息
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id;

    if (!userUuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 解析请求体
    const body: FlashcardUpdateInput = await request.json();

    // 3. 验证权限
    const { data: existing, error: fetchError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("uuid", uuid)
      .single() as { data: Flashcard | null; error: unknown };

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    if (existing.user_uuid !== userUuid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. 更新数据
    const { data: result, error: updateError } = await supabase
      .from("flashcards")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("uuid", uuid)
      .select()
      .single() as { data: Flashcard | null; error: unknown };

    if (updateError) {
      throw updateError;
    }

    // 5. 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Flashcard updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update flashcard error:", error);
    return NextResponse.json(
      {
        error: "Failed to update flashcard",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/flashcards/[uuid]
 * 删除闪卡
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    // 1. 获取用户信息
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id;

    if (!userUuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 验证权限
    const { data: existing, error: fetchError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("uuid", uuid)
      .single() as { data: Flashcard | null; error: unknown };

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    if (existing.user_uuid !== userUuid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. 删除数据
    const { error: deleteError } = await supabase
      .from("flashcards")
      .delete()
      .eq("uuid", uuid);

    if (deleteError) {
      throw deleteError;
    }

    // 4. 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Flashcard deleted successfully",
    });
  } catch (error) {
    console.error("Delete flashcard error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete flashcard",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

