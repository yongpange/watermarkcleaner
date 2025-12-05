import { NextRequest, NextResponse } from 'next/server';
import { processConversion } from '@/services/conversion/processor';
import { generateId } from '@/lib/conversion-utils';
import type { ConversionResult, ConversionOptions } from '@/types/conversion.d';
import { conversionTasks } from '../shared-store';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/types/database.types';

type ConversionInsert = Database['public']['Tables']['conversions']['Insert'];

export async function POST(request: NextRequest) {
  try {
    // Get user info (optional, supports anonymous users)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userUuid = user?.id || null;

    const body = await request.json();
    const { fileId, fileName, fileSize, fileType, fileUrl, fileKey, options } = body;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'File URL is required' },
        { status: 400 }
      );
    }

	    // Generate conversion ID (used as public conversion UUID)
	    const conversionId = generateId();

    // Calculate expiration time (24 hours for anonymous users)
    const expiresAt = userUuid
      ? null
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Initialize conversion task in memory
    const task: ConversionResult = {
      id: conversionId,
      fileId,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    conversionTasks.set(conversionId, task);

	    // Create database record (uuid == conversionId so we can query by conversionId later)
	    const conversionData: ConversionInsert = {
	      uuid: conversionId,
      user_uuid: userUuid,
      file_id: fileId,
      file_name: fileName || 'unknown',
      file_size: fileSize || 0,
      file_type: fileType || 'application/octet-stream',
      status: 'processing',
      progress: 0,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    const { error: insertError } = await supabase
      .from('conversions')
      .insert(conversionData as never);

    if (insertError) {
      console.error('Failed to create conversion record:', insertError);
      // Continue anyway, conversion will still work in memory
    }

    // Start async conversion (don't await)
    performConversion(conversionId, fileId, fileUrl, fileType, fileName).catch(async (error) => {
      console.error('Conversion error:', error);
      const failedTask = conversionTasks.get(conversionId);
      if (failedTask) {
        failedTask.status = 'failed';
        failedTask.error = {
          code: 'CONVERSION_ERROR',
          message: error.message || 'Conversion failed',
        };
        conversionTasks.set(conversionId, failedTask);

        // Update database
        const errorSupabase = await createClient();
        errorSupabase
          .from('conversions')
          .update({
            status: 'failed',
            error: failedTask.error,
          } as never)
          .eq('file_id', fileId)
          .then(() => {});
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        conversionId,
        status: 'processing',
      },
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start conversion' },
      { status: 500 }
    );
  }
}

async function performConversion(
  conversionId: string,
  fileId: string,
  fileUrl: string,
  fileType?: string,
  fileName?: string
) {
  const task = conversionTasks.get(conversionId);
  if (!task) return;

  // Create supabase client for this async function
  const supabase = await createClient();

  try {
    // Update progress: Reading file
    task.progress = 10;
    conversionTasks.set(conversionId, task);

    // Update database progress
    await supabase
      .from('conversions')
      .update({ progress: 10 } as never)
      .eq('file_id', fileId);

    // Read file from Cloudflare R2 via public URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from storage: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file MIME type
    let mimeType = fileType || 'application/octet-stream';

    if (!fileType) {
      const sourceName = fileName || fileUrl;
      const extension = sourceName.split('.').pop()?.toLowerCase();

      if (extension === 'pdf') mimeType = 'application/pdf';
      else if (extension === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (extension === 'doc') mimeType = 'application/msword';
      else if (extension === 'md') mimeType = 'text/markdown';
      else if (extension === 'txt') mimeType = 'text/plain';
    }

    // Update progress: Processing
    task.progress = 30;
    conversionTasks.set(conversionId, task);

    await supabase
      .from('conversions')
      .update({ progress: 30 } as never)
      .eq('file_id', fileId);

    // Perform conversion
    const result = await processConversion(buffer, mimeType);

    // Update progress: Finalizing
    task.progress = 90;
    conversionTasks.set(conversionId, task);

    await supabase
      .from('conversions')
      .update({ progress: 90 } as never)
      .eq('file_id', fileId);

    // Complete
    const completedAt = new Date().toISOString();
    task.status = 'completed';
    task.progress = 100;
    task.result = result;
    task.completedAt = completedAt;
    conversionTasks.set(conversionId, task);

    // Save to database
    const { error: updateError } = await supabase
      .from('conversions')
      .update({
        status: 'completed',
        progress: 100,
        result: result,
        completed_at: completedAt,
      } as never)
      .eq('file_id', fileId);

    if (updateError) {
      console.error('Failed to update conversion result:', updateError);
    } else {
      console.log(`✅ Conversion saved to database: ${fileId}`);
    }
  } catch (error) {
    throw error;
  }
}

