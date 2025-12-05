"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ConversionFile, ConversionResult } from "@/types/conversion.d";
import {
  formatFileSize,
  getStatusColor,
  getStatusBgColor,
  formatRelativeTime,
} from "@/lib/conversion-utils";
import ConversionProgress from "./ConversionProgress";
import { useRouter } from "@/i18n/routing";

interface FileCardProps {
  file: ConversionFile;
  conversion?: ConversionResult;
  onRemove?: () => void;
  onRetry?: () => void;
  onDownload?: () => void;
  className?: string;
}

export default function FileCard({
  file,
  conversion,
  onRemove,
  onRetry,
  onDownload,
  className,
}: FileCardProps) {
  const t = useTranslations("convert");
  const router = useRouter();

  const status = conversion?.status || "pending";
  const progress = conversion?.progress || 0;

  const handleEdit = () => {
    if (conversion?.id) {
      router.push(`/workspace?fileId=${conversion.id}` as any);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const isProcessing = status === "uploading" || status === "processing";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Left: Icon or Progress */}
          <div className="flex-shrink-0">
            {isProcessing ? (
              <ConversionProgress progress={progress} size={60} strokeWidth={4} />
            ) : (
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  getStatusBgColor(status)
                )}
              >
                {getStatusIcon() || <FileText className="w-6 h-6 text-gray-600" />}
              </div>
            )}
          </div>

          {/* Middle: File Info */}
          <div className="flex-1 min-w-0">
            {/* File name */}
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {file.name}
            </h3>

            {/* File size and status */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <Badge
                variant="secondary"
                className={cn("text-xs", getStatusColor(status))}
              >
                {t(`status.${status}`)}
              </Badge>
            </div>

            {/* Progress message */}
            {isProcessing && conversion && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {progress < 30 && t("progress.uploading_file")}
                {progress >= 30 && progress < 60 && t("progress.parsing_content")}
                {progress >= 60 && progress < 90 && t("progress.formatting")}
                {progress >= 90 && t("progress.finalizing")}
              </p>
            )}

            {/* Error message */}
            {isFailed && conversion?.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {conversion.error.message}
              </p>
            )}

            {/* Result metadata */}
            {isCompleted && conversion?.result && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                {conversion.result.metadata.wordCount && (
                  <span>
                    {t("result.word_count")}: {conversion.result.metadata.wordCount}
                  </span>
                )}
                {conversion.result.metadata.pageCount && (
                  <span>
                    {t("result.page_count")}: {conversion.result.metadata.pageCount}
                  </span>
                )}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {formatRelativeTime(file.uploadedAt)}
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {isCompleted && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t("actions.download")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  className="gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {t("actions.edit")}
                </Button>
              </>
            )}

            {isFailed && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t("actions.retry")}
              </Button>
            )}

            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

