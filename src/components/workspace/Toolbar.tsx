"use client";

import { Button } from "@/components/ui/button";
import {
  Download,
  Save,
  Share2,
  ArrowLeft,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  FileCode,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  onSave?: () => void;
  onExport?: (format: "markdown" | "pdf" | "docx") => void;
  onShare?: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  useAIPreview?: boolean;
  onToggleAIPreview?: () => void;
  isSaving?: boolean;
}

export default function Toolbar({
  onSave,
  onExport,
  onShare,
  showPreview,
  onTogglePreview,
  useAIPreview = true,
  onToggleAIPreview,
  isSaving = false,
}: ToolbarProps) {
  const t = useTranslations("workspace");
  const router = useRouter();

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Back button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/convert" as any)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("toolbar.back")}
          </Button>
        </div>

        {/* Center: Title */}
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">{t("title")}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle AI/Normal Preview - 按钮显示"点击后切换到什么" */}
          {showPreview && onToggleAIPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAIPreview}
              className="gap-2"
              title={useAIPreview ? "切换到原始预览" : "切换到 AI 笔记"}
            >
              {useAIPreview ? (
                <>
                  <FileCode className="w-4 h-4" />
                  原始预览
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 笔记
                </>
              )}
            </Button>
          )}

          {/* Toggle Preview */}
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePreview}
            className="gap-2"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Preview
              </>
            )}
          </Button>

          {/* Save */}
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : t("toolbar.save")}
            </Button>
          )}

          {/* Export */}
          {onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  {t("toolbar.export")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport("markdown")}>
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("pdf")} disabled>
                  PDF (.pdf) - Coming Soon
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("docx")} disabled>
                  Word (.docx) - Coming Soon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Share */}
          {onShare && (
            <Button
              variant="default"
              size="sm"
              onClick={onShare}
              className="gap-2"
              disabled
            >
              <Share2 className="w-4 h-4" />
              {t("toolbar.share")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

