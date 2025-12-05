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

    // 1) Try in-memory map first (works reliably in dev, best-effort cache in prod)
    const task = conversionTasks.get(id);

    if (task) {
      return NextResponse.json({
        success: true,
        data: {
          id: task.id,
          status: task.status,
          progress: task.progress,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        },
      });
    }

    // 2) Fallback to Supabase database (source of truth in production)
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

    return NextResponse.json({
      success: true,
      data: {
        id: dbConversion.uuid,
        status: dbConversion.status,
        progress: dbConversion.progress,
        createdAt: dbConversion.created_at,
        completedAt: dbConversion.completed_at,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

