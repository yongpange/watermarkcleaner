"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AIPreviewProps {
  originalContent: string;
  className?: string;
  fileId?: string; // ✅ 新增：用于保存到数据库
  initialAiContent?: string; // ✅ 新增：从数据库加载的初始内容
  onAiContentGenerated?: (content: string) => void; // ✅ 新增：生成完成回调
}

export default function AIPreview({
  originalContent,
  className,
  fileId,
  initialAiContent,
  onAiContentGenerated,
}: AIPreviewProps) {
  const [aiContent, setAiContent] = useState(initialAiContent || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(!!initialAiContent); // ✅ 如果有初始内容，标记为已生成

  const generateSummary = useCallback(async () => {
    if (!originalContent.trim()) {
      setError("No content to summarize");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAiContent(""); // 清空之前的内容

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: originalContent }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate summary");
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // 解码数据块
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            try {
              const json = JSON.parse(data);
              if (json.content) {
                accumulatedContent += json.content;
                setAiContent(accumulatedContent);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      setHasGenerated(true);

      // ✅ 保存到数据库
      if (fileId && accumulatedContent) {
        try {
          await fetch("/api/workspace/ai-summary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileId,
              aiSummary: accumulatedContent,
            }),
          });
          console.log("AI summary saved to database");
        } catch (saveError) {
          console.error("Failed to save AI summary:", saveError);
          // 不影响用户体验，静默失败
        }
      }

      // ✅ 调用回调函数
      if (onAiContentGenerated && accumulatedContent) {
        onAiContentGenerated(accumulatedContent);
      }

      toast.success("AI summary generated successfully");
    } catch (error) {
      console.error("AI generation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate summary";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [originalContent, fileId, onAiContentGenerated]);

  // 自动触发 AI 处理（仅首次加载）
  useEffect(() => {
    // 只在有内容且未生成过时触发
    if (originalContent && !hasGenerated && !isGenerating && !aiContent) {
      generateSummary();
    }
  }, [originalContent, hasGenerated, isGenerating, aiContent, generateSummary]);

  // 重新生成
  const handleRegenerate = () => {
    setHasGenerated(false);
    generateSummary();
  };

  // 简单的 Markdown 渲染（复用 MarkdownPreview 的逻辑）
  const renderMarkdown = (content: string) => {
    let html = content;

    // Escape HTML
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>'
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>'
    );
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>'
    );

    // Bold
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold">$1</strong>'
    );

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline">$1</a>'
    );

    // Code blocks
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>'
    );

    // Inline code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>'
    );

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>');

    // Wrap consecutive list items in ul
    html = html.replace(
      /(<li class="ml-4">.*<\/li>\n?)+/g,
      '<ul class="list-disc my-2">$&</ul>'
    );

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p class="my-2">');
    html = '<p class="my-2">' + html + "</p>";

    // Line breaks
    html = html.replace(/\n/g, "<br />");

    return html;
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">AI 学习笔记</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isGenerating}
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")}
          />
          重新生成
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 加载状态 */}
        {isGenerating && !aiContent && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">AI 正在生成学习笔记...</p>
            <p className="text-sm text-muted-foreground mt-2">
              这可能需要几秒钟时间
            </p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive font-semibold mb-2">生成失败</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRegenerate} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </div>
        )}

        {/* AI 生成的内容（流式显示） */}
        {aiContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(aiContent) }} />
            
            {/* 打字机光标效果 */}
            {isGenerating && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            )}
          </div>
        )}

        {/* 空状态 */}
        {!isGenerating && !aiContent && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              点击&quot;重新生成&quot;开始 AI 总结
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

