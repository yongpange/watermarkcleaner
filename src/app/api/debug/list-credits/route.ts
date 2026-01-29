
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = '140c9c26-8b03-4522-be47-a9b57d3252ba';
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('wmc_credit')
    .select('*')
    .eq('user_id', userId);
    
  return NextResponse.json({
    count: data?.length,
    records: data,
    error
  });
}
