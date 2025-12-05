// 文件上传演示组件
'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Info } from 'lucide-react';

export default function FileUploadDemo() {
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; filename: string; size: number; type: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 模拟文件上传
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟成功响应
    const mockResponse = {
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }
    };
    
    setUploadedFiles(prev => [...prev, mockResponse.data]);
    setIsUploading(false);
  };

  const handleSuccess = (response: unknown) => {
    console.log('文件上传成功:', response);
  };

  const handleError = (error: Error) => {
    console.error('文件上传失败:', error);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>文件上传演示</CardTitle>
          <CardDescription>
            支持拖拽上传、文件验证、预览和进度显示功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 文件上传组件 */}
          <FileUpload
            accept="image/*,.pdf,.doc,.docx,.txt"
            maxSize={10}
            onUpload={handleUpload}
            onSuccess={handleSuccess}
            onError={handleError}
            className="w-full"
          />

          {/* 使用说明 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              支持以下文件格式：图片、PDF、Word文档、文本文件。最大文件大小为10MB。
              您可以拖拽文件到上传区域，或点击选择文件。
            </AlertDescription>
          </Alert>

          {/* 上传成功的文件列表 */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">已上传的文件</h3>
              <div className="grid gap-3">
                {uploadedFiles.map((file, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.filename}</p>
                        <p className="text-xs text-gray-500">
                          文件ID: {file.id} | 大小: {(file.size / 1024 / 1024).toFixed(2)}MB
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        上传成功
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}