// 文件上传API路由
import { NextRequest, NextResponse } from 'next/server';
import { newStorage } from '@/lib/storage';

// 文件类型验证配置
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      );
    }

    // 文件大小验证
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过10MB' },
        { status: 400 }
      );
    }

    // 文件类型验证
    const fileExtension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!fileExtension) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}${fileExtension}`;

    // 构造存储 key，例如 uploads/<filename>
    const key = `uploads/${filename}`;

    // 保存文件到 Cloudflare R2（通过 S3 兼容接口）
    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = newStorage();

    let uploadResult;
    try {
      uploadResult = await storage.uploadFile({
        body: buffer,
        key,
        contentType: file.type,
        disposition: 'inline',
      });
    } catch (error) {
      console.error('上传到存储失败:', error);
      return NextResponse.json(
        { success: false, error: '文件上传失败' },
        { status: 500 }
      );
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        id: `${timestamp}-${randomString}`,
        filename: file.name,
        size: file.size,
        type: file.type,
          url: uploadResult.url,
          key: uploadResult.key,
        uploadTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    );
  }
}

// 文件验证API
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { valid: false, error: '未找到文件' },
        { status: 400 }
      );
    }

    // 文件大小验证
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        valid: false,
        error: '文件大小不能超过10MB'
      });
    }

    // 文件类型验证
    const fileExtension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!fileExtension) {
      return NextResponse.json({
        valid: false,
        error: '不支持的文件类型'
      });
    }

    return NextResponse.json({
      valid: true,
      message: '文件验证通过'
    });

  } catch (error) {
    console.error('文件验证错误:', error);
    return NextResponse.json(
      { valid: false, error: '文件验证失败' },
      { status: 500 }
    );
  }
}