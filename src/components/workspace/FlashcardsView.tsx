"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Star, RotateCw, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import Flashcard from "./Flashcard";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import type { Flashcard as FlashcardType } from "@/types/flashcard.d";

interface FlashcardData {
  id: number;
  question: string;
  answer: string;
  explanation: string;
}

interface FlashcardsViewProps {
  documentContent: string;
  className?: string;
}

export default function FlashcardsView({ documentContent, className }: FlashcardsViewProps) {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [_flashcardUuids, setFlashcardUuids] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [_isSaved, setIsSaved] = useState(false);

  // 从数据库加载闪卡
  const loadFlashcards = useCallback(async () => {
    if (!fileId) return;

    try {
      const response = await fetch(`/api/flashcards?fileId=${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to load flashcards');
      }

      const data = await response.json();
      if (data.success && data.data.flashcards && data.data.flashcards.length > 0) {
        // 转换数据库格式到组件格式
        const loadedFlashcards = data.data.flashcards.map((card: FlashcardType) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation || '',
        }));

        setFlashcards(loadedFlashcards);
        setFlashcardUuids(data.data.flashcards.map((card: FlashcardType) => card.uuid));
        setIsGenerated(true);
        setIsSaved(true);
        console.log('Flashcards loaded from database:', data.data.count);
      }
    } catch (error) {
      console.error('Load flashcards error:', error);
      // 静默失败，不影响用户体验
    }
  }, [fileId]);

  // 保存闪卡到数据库
  const saveFlashcards = async (flashcardsData: FlashcardData[]) => {
    if (!fileId) {
      console.warn('No fileId, skipping save');
      return;
    }

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          flashcards: flashcardsData.map((card, index) => ({
            question: card.question,
            answer: card.answer,
            explanation: card.explanation,
            order: index,
            source: 'ai',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save flashcards');
      }

      const data = await response.json();
      if (data.success) {
        setFlashcardUuids(data.data.flashcards.map((card: FlashcardType) => card.uuid));
        setIsSaved(true);
        console.log('Flashcards saved to database:', data.data.count);
        toast.success('闪卡已保存到数据库');
      }
    } catch (error) {
      console.error('Save flashcards error:', error);
      toast.error('保存闪卡失败，但您仍可以使用');
    }
  };

  // 生成闪卡
  const generateFlashcards = async () => {
    if (!documentContent || documentContent.trim().length === 0) {
      toast.error("文档内容为空，无法生成闪卡");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/workspace/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '生成闪卡失败');
      }

      const data = await response.json();

      if (data.success && data.data.flashcards) {
        setFlashcards(data.data.flashcards);
        setCurrentIndex(0);
        setIsGenerated(true);
        toast.success(`成功生成 ${data.data.flashcards.length} 个闪卡`);

        // 生成成功后，保存到数据库
        if (fileId) {
          await saveFlashcards(data.data.flashcards);
        }
      } else {
        throw new Error('闪卡数据格式错误');
      }
    } catch (error) {
      console.error('Generate flashcards error:', error);
      toast.error(error instanceof Error ? error.message : '生成闪卡失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 导航到上一张
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
  }, [flashcards.length]);

  // 导航到下一张
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
  }, [flashcards.length]);

  // 页面加载时尝试从数据库加载闪卡
  useEffect(() => {
    if (fileId) {
      loadFlashcards();
    }
  }, [fileId, loadFlashcards]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGenerated || flashcards.length === 0) return;

      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerated, flashcards.length, handlePrevious, handleNext]);

  return (
    <div className={cn("flex flex-col h-full bg-muted/20", className)}>
      {/* 未生成状态 - 显示生成按钮 */}
      {!isGenerated && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <RotateCw className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">生成学习闪卡</h2>
              <p className="text-muted-foreground">
                AI 将根据您的文档内容生成 12 个问答卡片，帮助您更好地学习和记忆
              </p>
            </div>
            <Button
              onClick={generateFlashcards}
              disabled={isLoading || !documentContent}
              size="lg"
              className="w-full max-w-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  正在生成闪卡...
                </>
              ) : (
                <>
                  <RotateCw className="w-5 h-5 mr-2" />
                  生成闪卡
                </>
              )}
            </Button>
            {!documentContent && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                请先上传文档内容
              </p>
            )}
          </div>
        </div>
      )}

      {/* 已生成状态 - 显示闪卡 */}
      {isGenerated && flashcards.length > 0 && (
        <div className="flex-1 flex flex-col p-8">
          {/* 进度指示器 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-lg font-bold text-primary">
                {currentIndex + 1} / {flashcards.length}
              </span>
            </div>
          </div>

          {/* 闪卡 */}
          <div className="flex-1 flex items-center justify-center mb-6">
            <div className="w-full max-w-2xl">
              <Flashcard
                question={flashcards[currentIndex].question}
                answer={flashcards[currentIndex].answer}
                explanation={flashcards[currentIndex].explanation}
              />
            </div>
          </div>

          {/* 导航按钮 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="lg"
              className="min-w-[120px]"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              上一张
            </Button>
            <Button
              onClick={handleNext}
              variant="outline"
              size="lg"
              className="min-w-[120px]"
            >
              下一张
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* 功能按钮区域 */}
          <div className="flex items-center justify-center gap-3 pt-6 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled
              title="功能开发中"
            >
              <Star className="w-4 h-4" />
              已收藏
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                // 触发卡片翻转的提示
                toast.info("点击卡片即可翻转查看答案");
              }}
            >
              <RotateCw className="w-4 h-4" />
              点击翻转
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled
              title="功能开发中"
            >
              <BarChart3 className="w-4 h-4" />
              通过间隔重复跟踪统计数据
            </Button>
          </div>

          {/* 重新生成按钮 */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={generateFlashcards}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  重新生成中...
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4 mr-2" />
                  重新生成闪卡
                </>
              )}
            </Button>
          </div>

          {/* 键盘提示 */}
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              提示：使用 ← → 方向键快速切换卡片
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

