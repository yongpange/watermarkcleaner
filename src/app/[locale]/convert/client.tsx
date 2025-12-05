"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DropZone from "@/components/convert/DropZone";
import FileCard from "@/components/convert/FileCard";
import {
  useConversionStore,
  useConversionFiles,
  useConversionResults,
} from "@/stores/conversion-store";
import type { ConversionFile } from "@/types/conversion.d";
import { generateId } from "@/lib/conversion-utils";
import { downloadTextAsFile } from "@/lib/conversion-utils";

export default function ConvertClient() {
  const t = useTranslations("convert");
  const filesMap = useConversionFiles();
  const conversionsMap = useConversionResults();
  const { addFile, removeFile, updateConversion, clearCompleted } =
    useConversionStore();

  // 使用 useMemo 缓存数组转换，避免无限重渲染
  const files = useMemo(() => Array.from(filesMap.values()), [filesMap]);
  const conversions = useMemo(() => Array.from(conversionsMap.values()), [conversionsMap]);

  const pollConversionStatus = useCallback(
    async (taskId: string, conversionId: string) => {
      // 每次轮询最多 60 次，间隔 2s，大约 2 分钟超时
      const maxAttempts = 60;
      let attempts = 0;

      const poll = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error(
            "Conversion timeout - please try again with a smaller file",
          );
        }

        attempts++;

        const response = await fetch(`/api/convert/status/${taskId}`);

        if (!response.ok) {
          if (response.status === 404) {
            // 任务不存在是终止条件，不再继续轮询
            throw new Error("Conversion task not found");
          }
          // 其它非 2xx 也视为错误，直接抛出给上层处理
          throw new Error("Failed to get conversion status");
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error("Invalid status response");
        }

        const { status, progress } = data.data;

        updateConversion(conversionId, {
          status,
          // 结果还没拿到之前，进度最多到 95%
          progress: Math.min(progress, 95),
        });

        if (status === "completed") {
          // 状态已完成，再单独拉一次最终结果
          const resultResponse = await fetch(
            `/api/convert/result/${taskId}`,
          );

          if (!resultResponse.ok) {
            throw new Error("Failed to get conversion result");
          }

          const resultData = await resultResponse.json();

          if (!resultData.success || !resultData.data?.result) {
            throw new Error("Invalid result response");
          }

          updateConversion(conversionId, {
            status: "completed",
            progress: 100,
            result: resultData.data.result,
            completedAt: new Date().toISOString(),
          });

          toast.success(t("status.completed"));
          return;
        }

        if (status === "failed") {
          // 后端已经明确失败，直接结束轮询，把错误抛给上层
          const errorMsg = data.data.error?.message || "Conversion failed";
          throw new Error(errorMsg);
        }

        // 仍在 processing，2s 后继续轮询
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return poll();
      };

      return poll();
    },
    [updateConversion, t],
  );

	  const uploadAndConvert = useCallback(async (file: File, fileId: string) => {
    const conversionId = generateId();

    try {
      // Validate file before upload
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      if (!file || file.size === 0) {
        throw new Error('File is empty or invalid. Please select a valid file.');
      }

      // Initialize conversion
      updateConversion(conversionId, {
        id: conversionId,
        fileId,
        status: "uploading",
        progress: 0,
        createdAt: new Date().toISOString(),
      });

      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", file);

      // Log FormData contents
      console.log('FormData file:', formData.get('file'));

      updateConversion(conversionId, { progress: 10 });

	      const uploadResponse = await fetch("/api/convert/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

	      const uploadData = await uploadResponse.json();
	      const uploadInfo = uploadData?.data;
	
	      if (!uploadData.success || !uploadInfo?.fileId || !uploadInfo.url) {
        throw new Error("Invalid upload response");
      }

      updateConversion(conversionId, {
        progress: 30,
        status: "processing",
      });

      // Step 2: Start conversion
	      const processResponse = await fetch("/api/convert/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
	          fileId: uploadInfo.fileId,
	          fileUrl: uploadInfo.url,
	          fileKey: uploadInfo.storageKey || uploadInfo.key,
	          fileName: file.name,
	          fileSize: file.size,
	          fileType: file.type,
          options: {
            targetFormat: "markdown",
            detectLanguage: true,
          },
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Conversion failed");
      }

      const processData = await processResponse.json();

      if (!processData.success || !processData.data?.conversionId) {
        throw new Error("Invalid conversion response");
      }

      const taskId = processData.data.conversionId;

      // Step 3: Poll for status
      await pollConversionStatus(taskId, conversionId);
    } catch (error) {
      console.error("Conversion error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      updateConversion(conversionId, {
        status: "failed",
        error: {
          code: "CONVERSION_ERROR",
          message: errorMessage,
        },
      });

      // Show user-friendly error message
      if (errorMessage.includes("Upload failed")) {
        toast.error(t("errors.upload_failed"));
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast.error(t("errors.network_error"));
      } else {
        toast.error(t("errors.conversion_failed"));
      }
    }
  }, [updateConversion, t, pollConversionStatus]);

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      for (const file of selectedFiles) {
        // Create file object
        const fileId = generateId();
        const conversionFile: ConversionFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        };

        // Add to store
        addFile(conversionFile);

        // Start upload and conversion
        await uploadAndConvert(file, fileId);
      }
    },
    [addFile, uploadAndConvert]
  );



  const handleRemoveFile = (fileId: string) => {
    removeFile(fileId);
  };

  const handleRetry = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    // Note: We can't re-upload the original File object from store
    // This is a limitation - in production, you might want to keep File objects
    toast.info("Please re-upload the file to retry");
  };

  const handleDownload = (conversionId: string) => {
    const conversion = conversions.find((c) => c.id === conversionId);
    if (!conversion?.result) return;

    const filename = `${conversion.fileId}.md`;
    downloadTextAsFile(
      conversion.result.content,
      filename,
      "text/markdown"
    );
  };

  const handleClearAll = () => {
    clearCompleted();
    toast.success(t("actions.clear_all"));
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium mb-3 md:mb-4">
          <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
          {t("title")}
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-4">
          {t("subtitle")}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          {t("description")}
        </p>
      </div>

      {/* Drop Zone */}
      <div className="mb-8">
        <DropZone onFilesSelected={handleFilesSelected} />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Files ({files.length})
            </h2>
            {conversions.some((c) => c.status === "completed" || c.status === "failed") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
              >
                {t("actions.clear_all")}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((file) => {
              const conversion = conversions.find((c) => c.fileId === file.id);
              return (
                <FileCard
                  key={file.id}
                  file={file}
                  conversion={conversion}
                  onRemove={() => handleRemoveFile(file.id)}
                  onRetry={() => handleRetry(file.id)}
                  onDownload={() => conversion && handleDownload(conversion.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Features */}
      {files.length === 0 && (
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Convert your files in under 3 seconds
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">Smart Conversion</h3>
            <p className="text-sm text-muted-foreground">
              Preserves formatting and structure
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">No Sign-up Required</h3>
            <p className="text-sm text-muted-foreground">
              Start converting immediately
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

