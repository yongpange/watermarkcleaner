import { NextRequest, NextResponse } from 'next/server';
import { conversionTasks } from '../../shared-store';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/types/database.types';

type ConversionRow = Database['public']['Tables']['conversions']['Row'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
	    	const { id } = await params;

    // First, try to get from memory (for recent conversions)
    const task = conversionTasks.get(id);

    if (task) {
      if (task.status !== 'completed') {
        return NextResponse.json(
          { success: false, error: 'Conversion not completed yet' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: task.id,
          fileId: task.fileId,
          status: task.status,
          result: task.result,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        },
      });
    }

	    // If not in memory, try to get from database (for persistent storage)
	    const supabase = await createClient();
	    const { data: dbConversion, error: dbError } = await supabase
	      .from('conversions')
	      .select('*')
	      .eq('uuid', id)
	      .single() as { data: ConversionRow | null; error: unknown };

    if (dbError || !dbConversion) {
      return NextResponse.json(
        { success: false, error: 'Conversion not found' },
        { status: 404 }
      );
    }

    if (dbConversion.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Conversion not completed yet' },
        { status: 400 }
      );
    }

	    return NextResponse.json({
	      success: true,
	      data: {
	        id: dbConversion.uuid,
	        fileId: dbConversion.file_id,
	        status: dbConversion.status,
	        result: dbConversion.result,
	        createdAt: dbConversion.created_at,
	        completedAt: dbConversion.completed_at,
	      },
	    });
  } catch (error) {
    console.error('Result fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get result' },
      { status: 500 }
    );
  }
}

