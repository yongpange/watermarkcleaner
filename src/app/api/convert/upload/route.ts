import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/conversion-utils';
import { newStorage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Failed to parse form data:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File;

    // Log received file info
    console.log('Received file:', {
      exists: !!file,
      name: file?.name,
      size: file?.size,
      type: file?.type,
      isFile: file instanceof File
    });

    if (!file) {
      console.error('No file in form data');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file is actually a File object
    if (!(file instanceof File)) {
      console.error('File is not a File instance:', typeof file);
      return NextResponse.json(
        { success: false, error: 'Invalid file object' },
        { status: 400 }
      );
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { success: false, error: 'File size exceeds 20MB limit' },
        { status: 400 }
      );
    }

    // Validate file is not empty
    if (file.size === 0) {
      console.error('File is empty:', file.name);
      return NextResponse.json(
        { success: false, error: 'File is empty. Please select a valid file with content.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, DOC, TXT, MD`
        },
        { status: 400 }
      );
    }

    // Generate unique file ID and storage key
    const fileId = generateId();
    const extension = file.name.split('.').pop() || 'bin';
    const key = `conversions/${fileId}.${extension}`;

    // Read file into buffer
    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch (error) {
      console.error('Failed to read file:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to read file data' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(bytes);

    // Upload to Cloudflare R2 (S3-compatible storage)
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
      console.error('Failed to upload file to storage:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        filename: file.name,
        size: file.size,
        type: file.type,
        storageKey: uploadResult.key,
        url: uploadResult.url,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

