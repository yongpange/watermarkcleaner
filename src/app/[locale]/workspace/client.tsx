"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Toolbar from "@/components/workspace/Toolbar";
import Sidebar from "@/components/workspace/Sidebar";
import MarkdownEditor from "@/components/workspace/MarkdownEditor";
import MarkdownPreview from "@/components/workspace/MarkdownPreview";
import AIPreview from "@/components/workspace/AIPreview";
import ChatInterface from "@/components/workspace/ChatInterface";
import FlashcardsView from "@/components/workspace/FlashcardsView";
import { useConversionStore } from "@/stores/conversion-store";
import { downloadTextAsFile } from "@/lib/conversion-utils";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversionMetadata } from "@/types/conversion";

export default function WorkspaceClient() {
  const t = useTranslations("workspace");
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  const { conversions } = useConversionStore();
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [useAIPreview, setUseAIPreview] = useState(true); // 默认使用 AI 预览
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metadata, setMetadata] = useState<ConversionMetadata | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<'document' | 'chatbot' | 'flashcards' | 'quiz'>('document');

  // ✅ 新增：AI 学习笔记状态
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  useEffect(() => {
    if (fileId) {
      // Find conversion in store
      const conversion = conversions.get(fileId);

      if (conversion?.result) {
        setContent(conversion.result.content);
        setMetadata(conversion.result.metadata);
        // ✅ 加载 AI 学习笔记（如果存在）
        if (conversion.result.aiSummary) {
          setAiSummary(conversion.result.aiSummary);
        }
        setIsLoading(false);
      } else {
        // Try to fetch from API
        fetchConversionResult(fileId);
      }
    } else {
      setIsLoading(false);
    }
  }, [fileId, conversions]);

  const fetchConversionResult = async (id: string) => {
    try {
      const response = await fetch(`/api/convert/result/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversion result");
      }

      const data = await response.json();
      if (data.success && data.data.result) {
        setContent(data.data.result.content);
        setMetadata(data.data.result.metadata);
        // ✅ 加载 AI 学习笔记（如果存在）
        if (data.data.result.aiSummary) {
          setAiSummary(data.data.result.aiSummary);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 调用 API 保存到数据库
      const response = await fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          content,
          metadata: {
            wordCount: content.split(/\s+/).length,
            characterCount: content.length,
            lastModified: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save document');
      }

      const result = await response.json();

      // 更新 Zustand store（本地缓存）
      if (fileId) {
        useConversionStore.getState().updateConversion(fileId, {
          result: {
            content,
            format: 'markdown',
            metadata: result.data,
          },
        });
      }

      toast.success("Document saved to database successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error((error as Error).message || "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: "markdown" | "pdf" | "docx") => {
    if (format === "markdown") {
      const filename = `document-${Date.now()}.md`;
      downloadTextAsFile(content, filename, "text/markdown");
      toast.success("Exported as Markdown");
    } else {
      toast.info(`${format.toUpperCase()} export coming soon`);
    }
  };

  const handleShare = () => {
    toast.info("Share feature coming soon");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <Toolbar
        onSave={handleSave}
        onExport={handleExport}
        onShare={handleShare}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        useAIPreview={useAIPreview}
        onToggleAIPreview={() => setUseAIPreview(!useAIPreview)}
        isSaving={isSaving}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          metadata={metadata || undefined}
          onModeChange={setWorkspaceMode}
          activeMode={workspaceMode}
        />

        {/* Document Mode: AI Preview/Original Preview + Chat */}
        {workspaceMode === 'document' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: AI 学习笔记 或 原始预览 */}
            <div className="w-1/2 border-r relative">
              {/* ✅ 始终渲染 AIPreview，用 CSS 控制显示，避免组件卸载导致状态丢失 */}
              <div className={cn("h-full", useAIPreview ? 'block' : 'hidden')}>
                <AIPreview
                  originalContent={content}
                  fileId={fileId || undefined}
                  initialAiContent={aiSummary}
                  onAiContentGenerated={(generatedContent) => {
                    setAiSummary(generatedContent);
                  }}
                />
              </div>

              {/* ✅ 始终渲染 MarkdownPreview，用 CSS 控制显示 */}
              <div className={cn("h-full overflow-y-auto", !useAIPreview ? 'block' : 'hidden')}>
                <MarkdownPreview content={content} />
              </div>
            </div>

            {/* Right: 聊天界面 */}
            <div className="w-1/2">
              <ChatInterface
                documentContent={content}
                fileId={fileId || undefined}
              />
            </div>
          </div>
        )}

        {/* Chatbot Mode: Full Chat Interface */}
        {workspaceMode === 'chatbot' && (
          <div className="flex-1">
            <ChatInterface
              documentContent={content}
              fileId={fileId || undefined}
            />
          </div>
        )}

        {/* Flashcards Mode: Flashcards + Chat */}
        {workspaceMode === 'flashcards' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: 闪卡 */}
            <div className="w-1/2 border-r">
              <FlashcardsView documentContent={content} />
            </div>

            {/* Right: 聊天界面 */}
            <div className="w-1/2">
              <ChatInterface
                documentContent={content}
                fileId={fileId || undefined}
              />
            </div>
          </div>
        )}

        {/* Quiz Mode - Coming soon */}
        {workspaceMode === 'quiz' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-semibold mb-2">功能开发中</p>
              <p className="text-sm">敬请期待...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

