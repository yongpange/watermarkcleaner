import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { FlashcardReviewInput } from "@/types/flashcard.d";
import type { Database } from "@/types/database.types";

type Flashcard = Database['public']['Tables']['flashcards']['Row'];

/**
 * SM-2 算法计算下次复习时间
 * @param quality 0-5 (0=完全忘记, 5=完美记忆)
 * @param easeFactor 当前难度系数
 * @param interval 当前间隔（天）
 * @param repetitions 重复次数
 */
function calculateNextReview(
  quality: number,
  easeFactor: number,
  interval: number,
  repetitions: number
) {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // 回答正确
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions += 1;
  } else {
    // 回答错误，重置
    newRepetitions = 0;
    newInterval = 1;
  }

  // 更新难度系数
  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // 计算下次复习时间
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

/**
 * POST /api/flashcards/[uuid]/review
 * 记录复习结果，更新 SRS 参数
 */
export async function POST(
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
    const body: FlashcardReviewInput = await request.json();
    const { quality } = body;

    if (quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: "Quality must be between 0 and 5" },
        { status: 400 }
      );
    }

    // 3. 获取当前闪卡数据
    const { data: card, error: selectError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('uuid', uuid)
      .limit(1)
      .single() as { data: Flashcard | null; error: unknown };

    if (selectError || !card) {
      console.error('Flashcard not found:', selectError);
      return NextResponse.json(
        { error: "Flashcard not found" },
        { status: 404 }
      );
    }

    if (card.user_uuid !== userUuid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. 计算新的 SRS 参数
    const { easeFactor, interval, repetitions, nextReviewAt } =
      calculateNextReview(quality, card.ease_factor, card.interval, card.repetitions);

    // 5. 计算新的掌握程度
    // quality >= 3: 增加 10 分
    // quality < 3: 减少 20 分
    // 范围限制在 0-100
    const masteryChange = quality >= 3 ? 10 : -20;
    const newMastery = Math.min(100, Math.max(0, card.mastery + masteryChange));

    // 6. 更新数据库
    const now = new Date();
    const { data: updatedCard, error: updateError } = await supabase
      .from('flashcards')
      .update({
        views: card.views + 1,
        mastery: newMastery,
        ease_factor: easeFactor,
        interval,
        repetitions,
        last_reviewed_at: now.toISOString(),
        next_review_at: nextReviewAt.toISOString(),
        updated_at: now.toISOString(),
      } as never)
      .eq('uuid', uuid)
      .select()
      .single() as { data: Flashcard | null; error: unknown };

    if (updateError || !updatedCard) {
      console.error('Update flashcard error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update flashcard' },
        { status: 500 }
      );
    }

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Review recorded successfully",
      data: {
        flashcard: updatedCard,
        nextReview: {
          interval,
          nextReviewAt: nextReviewAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Review flashcard error:", error);
    return NextResponse.json(
      {
        error: "Failed to record review",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

