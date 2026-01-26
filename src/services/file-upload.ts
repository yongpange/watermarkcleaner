// 文件上传服务
export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    size: number;
    type: string;
    id: string;
  };
  error?: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  progress: number;
}

export class FileUploadService {
  private static instance: FileUploadService;
  private baseURL: string;

  private constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * 上传文件
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 上传进度监听
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress?.(progress);
        }
      });

      // 上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (_error) {
            reject(new Error('解析响应失败'));
          }
        } else {
          reject(new Error(`上传失败: ${xhr.statusText}`));
        }
      });

      // 上传错误
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'));
      });

      // 上传取消
      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'));
      });

      // 发送请求
      xhr.open('POST', `${this.baseURL}/upload`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send(formData);
    });
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(
    files: File[],
    onProgress?: (index: number, progress: number) => void
  ): Promise<UploadResponse[]> {
    const results: UploadResponse[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(files[i], (progress) => {
          onProgress?.(i, progress);
        });
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : '上传失败'
        });
      }
    }
    
    return results;
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/upload/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`删除失败: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  /**
   * 获取文件列表
   */
  async getFiles(): Promise<{ id: string; filename: string; size: number; type: string; url: string }[]> {
    try {
      const response = await fetch(`${this.baseURL}/uploads`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`获取文件列表失败: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return [];
    }
  }

  /**
   * 验证文件
   */
  async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/upload/validate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`验证失败: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        valid: result.valid || false,
        error: result.error
      };
    } catch (error) {
      console.error('文件验证失败:', error);
      return {
        valid: false,
        error: '验证失败'
      };
    }
  }
}

// 导出单例实例
export const fileUploadService = FileUploadService.getInstance();