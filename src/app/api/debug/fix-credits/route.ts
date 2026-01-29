
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderNo = searchParams.get('order_no');

  if (!orderNo) {
    return NextResponse.json({ error: 'Missing order_no' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Get order
    const { data: order, error: orderError } = await supabase
      .from('wmc_order')
      .select('*')
      .eq('order_no', orderNo)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 }); 
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Order not paid' }, { status: 400 });
    }

    // 2. Check existence
    const { data: existing } = await supabase
      .from('wmc_credit')
      .select('*')
      .eq('order_no', orderNo);

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Credits already exist', count: existing.length });
    }

    // 3. Insert directly
    const transactionNo = `FIX-${Date.now()}`;
    const { data: inserted, error: insertError } = await supabase
      .from('wmc_credit')
      .insert([{
        user_id: order.user_id,
        order_no: orderNo,
        transaction_no: transactionNo,
        transaction_type: 'grant', // Lowercase as per DB constraint if any, or matching credit.ts
        transaction_scene: 'manual_fix',
        credits: order.credits_amount || 500, // Fallback
        description: 'Manual fix for missing credits',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true, inserted });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
