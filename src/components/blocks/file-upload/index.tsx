"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, File, Image as ImageIcon, Music, Video, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { UploadedFile, FileUploadConfig } from "@/types/file";
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES, FILE_CATEGORIES } from "@/types/file";

interface FileUploadProps {
  config?: FileUploadConfig;
  onFileSelect?: (files: File[]) => void;
  onFileUpload?: (files: UploadedFile[]) => void;
  onFileRemove?: (fileId: string) => void;
  className?: string;
}

export default function FileUpload({
  config = {},
  onFileSelect,
  onFileUpload,
  onFileRemove,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    maxSize = MAX_FILE_SIZE,
    acceptedTypes = Object.keys(SUPPORTED_FILE_TYPES),
    multiple = true,
  } = config;

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />;
    if (type.startsWith("audio/")) return <Music className="h-8 w-8" />;
    if (type.startsWith("video/")) return <Video className="h-8 w-8" />;
    if (type.includes("text/") || type.includes("code")) return <Code className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  // Get file category
  const getFileCategory = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }
    return "other";
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Validate file
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize}MB limit`,
      };
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported`,
      };
    }

    return { valid: true };
  }, [maxSize, acceptedTypes]);

  // Upload file to server
  const uploadFile = useCallback(async (file: File, fileId: string) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Update status to uploading
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploading" as const, progress: 0 } : f
        )
      );

      // Simulate progress (in real implementation, use XMLHttpRequest for progress tracking)
      const progressInterval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileId && f.progress !== undefined && f.progress < 90) {
              return { ...f, progress: f.progress + 10 };
            }
            return f;
          })
        );
      }, 200);

      const response = await fetch("/api/file/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      // Update status to success
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "success" as const,
                progress: 100,
                url: result.file.url,
              }
            : f
        )
      );

      toast.success(`${file.name} uploaded successfully`);
      onFileUpload?.([
        {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.file.url,
          status: "success",
          progress: 100,
        },
      ]);
    } catch (error) {
      // Update status to error
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );

      toast.error(
        `Failed to upload ${file.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [onFileUpload]);

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const newUploadedFiles: UploadedFile[] = [];

      fileArray.forEach((file) => {
        const validation = validateFile(file);

        if (!validation.valid) {
          toast.error(validation.error || "Invalid file");
          return;
        }

        validFiles.push(file);

        // Create uploaded file object
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "pending",
          progress: 0,
        };

        // Generate preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadedFile.preview = e.target?.result as string;
            setUploadedFiles((prev) =>
              prev.map((f) => (f.id === uploadedFile.id ? uploadedFile : f))
            );
          };
          reader.readAsDataURL(file);
        }

        newUploadedFiles.push(uploadedFile);
      });

      if (validFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
        onFileSelect?.(validFiles);
        toast.success(`${validFiles.length} file(s) selected`);

        // Auto-upload files
        validFiles.forEach((file, index) => {
          const fileId = newUploadedFiles[index].id;
          uploadFile(file, fileId);
        });
      }
    },
    [validateFile, onFileSelect, uploadFile]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [handleFiles]
  );

  // Handle click to select files
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    onFileRemove?.(fileId);
    toast.success("File removed");
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50",
          "cursor-pointer"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div
            className={cn(
              "rounded-full p-4 transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">
              {isDragging ? "Drop files here" : "Select a file or drag and drop here"}
            </h3>
            <p className="text-sm text-muted-foreground">
              PDF, TXT, DOCX, images, audio and other formats · Max {maxSize}MB
            </p>
          </div>

          <Button type="button" variant="outline" size="sm">
            Select File
          </Button>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              {/* File Icon/Preview */}
              <div className="flex-shrink-0">
                {file.preview ? (
                  <Image
                    src={file.preview}
                    alt={file.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-muted-foreground">
                    {getFileIcon(file.type)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} · {getFileCategory(file.name)}
                </p>
                
                {/* Progress Bar */}
                {file.status === "uploading" && file.progress !== undefined && (
                  <Progress value={file.progress} className="mt-2 h-1" />
                )}
                
                {/* Status */}
                {file.status === "error" && (
                  <p className="text-xs text-destructive mt-1">{file.error}</p>
                )}
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => handleRemoveFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

