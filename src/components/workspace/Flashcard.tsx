"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface FlashcardProps {
  question: string;
  answer: string;
  explanation: string;
  className?: string;
}

export default function Flashcard({ question, answer, explanation, className }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={className} style={{ perspective: '1000px' }}>
      <div
        className="relative w-full h-[400px] transition-transform duration-500 cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleFlip}
      >
        {/* 正面 - 问题 */}
        <Card
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800",
            "shadow-lg hover:shadow-xl transition-shadow"
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="text-center space-y-4">
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              定义
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
              {question}
            </div>
            <div className="text-sm text-muted-foreground mt-8">
              点击卡片查看答案
            </div>
          </div>
        </Card>

        {/* 背面 - 答案和解释 */}
        <Card
          className={cn(
            "absolute inset-0 flex flex-col p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800",
            "shadow-lg hover:shadow-xl transition-shadow overflow-y-auto"
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="space-y-6">
            <div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                答案
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
                {answer}
              </div>
            </div>

            <div className="border-t border-green-200 dark:border-green-800 pt-4">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                解释
              </div>
              <div className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {explanation}
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-center mt-8">
              点击卡片返回问题
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

