'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export interface FileUploadProps {
  accept?: string;
  maxSize?: number; // 单位：MB
  onUpload?: (file: File) => Promise<void>;
  onSuccess?: (response: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  preview?: string;
  error?: string;
}

export function FileUpload({
  accept = '*/*',
  maxSize = 10,
  onUpload,
  onSuccess,
  onError,
  className
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 文件格式验证
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 大小验证
    if (file.size > maxSize * 1024 * 1024) {
      return {
        valid: false,
        error: `文件大小不能超过 ${maxSize}MB`
      };
    }

    // 文件类型验证
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const fileType = file.type;

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return {
          valid: false,
          error: `不支持的文件格式，支持的格式：${accept}`
        };
      }
    }

    return { valid: true };
  };

  // 生成文件预览
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  };

  // 处理文件添加
  const handleFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validation = validateFile(file);

      if (validation.valid) {
        const preview = await generatePreview(file);
        newFiles.push({
          file,
          id: generateId(),
          progress: 0,
          status: 'pending',
          preview
        });
      } else {
        newFiles.push({
          file,
          id: generateId(),
          progress: 0,
          status: 'error',
          error: validation.error
        });
      }
    }

    setFiles(prev => [...prev, ...newFiles]);

    // 自动上传有效文件
    newFiles.forEach(fileInfo => {
      if (fileInfo.status === 'pending') {
        uploadFile(fileInfo);
      }
    });
  };

  // 拖拽事件处理
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  // 文件选择处理
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  // 上传文件
  const uploadFile = async (fileInfo: UploadedFile) => {
    setFiles(prev => prev.map(f => 
      f.id === fileInfo.id ? { ...f, status: 'uploading' } : f
    ));

    // 创建模拟进度更新
    const progressInterval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === fileInfo.id && f.status === 'uploading') {
          const newProgress = Math.min(f.progress + Math.random() * 15, 90);
          return { ...f, progress: newProgress };
        }
        return f;
      }));
    }, 200);

    try {
      let result;

      // 如果有自定义的上传函数，使用它
      if (onUpload) {
        await onUpload(fileInfo.file);
        result = { success: true };
      } else {
        // 否则使用默认的API上传
        const formData = new FormData();
        formData.append('file', fileInfo.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        result = await response.json();
      }

      clearInterval(progressInterval);

      if (result.success) {
        setFiles(prev => prev.map(f =>
          f.id === fileInfo.id ? { ...f, progress: 100, status: 'success' } : f
        ));
        onSuccess?.(result);
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : '上传失败' 
        } : f
      ));

      onError?.(error instanceof Error ? error : new Error('上传失败'));
    }
  };

  // 移除文件
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 获取文件图标
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('video')) return '🎥';
    if (file.type.includes('audio')) return '🎵';
    return '📎';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 拖拽上传区域 */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/50',
          'hover:bg-accent/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-medium text-foreground">
              拖拽文件到此处或点击选择
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              支持 {accept} 格式，最大 {maxSize}MB
            </p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((fileInfo) => (
            <Card key={fileInfo.id} className="p-4">
              <div className="flex items-center space-x-4">
                {/* 文件预览 */}
                <div className="flex-shrink-0">
                  {fileInfo.preview ? (
                    <Image
                      src={fileInfo.preview}
                      alt={fileInfo.file.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xl">
                      {getFileIcon(fileInfo.file)}
                    </div>
                  )}
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground truncate">
                      {fileInfo.file.name}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileInfo.file.size)}
                  </p>
                </div>

                {/* 状态指示器 */}
                <div className="flex-shrink-0">
                  {fileInfo.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  {fileInfo.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  {fileInfo.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  )}
                  {fileInfo.status === 'pending' && (
                    <div className="w-5 h-5 bg-muted-foreground/30 rounded-full animate-pulse" />
                  )}
                </div>

                {/* 移除按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileInfo.id)}
                  className="flex-shrink-0 p-1 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* 上传进度条 */}
              {fileInfo.status === 'uploading' && (
                <div className="mt-3">
                  <Progress value={fileInfo.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    上传中... {Math.round(fileInfo.progress)}%
                  </p>
                </div>
              )}

              {/* 错误信息 */}
              {fileInfo.status === 'error' && fileInfo.error && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 dark:text-red-400">{fileInfo.error}</p>
                </div>
              )}

              {/* 成功信息 */}
              {fileInfo.status === 'success' && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400">上传成功！</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
