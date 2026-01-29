import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { checkCredits } from '@/lib/credits/check';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const searchParams = req.nextUrl.searchParams;
  const orderNo = searchParams.get('order_no');

  if (!orderNo) {
    return NextResponse.json({ error: 'Missing order_no' }, { status: 400 });
  }

  // 1. Get Order
  const { data: order, error: orderError } = await (supabase as any)
    .from('wmc_order')
    .select('*')
    .eq('order_no', orderNo)
    .single();

  if (orderError) {
    return NextResponse.json({ error: 'Order not found', details: orderError }, { status: 404 });
  }

  // 2. Get Credits for this order
  const { data: credits, error: creditError } = await (supabase as any)
    .from('wmc_credit')
    .select('*')
    .eq('order_no', orderNo);

  // 3. Get User Balance
  const { data: userCredits } = await (supabase as any)
    .from('wmc_credit')
    .select('*')
    .eq('user_id', order.user_id)
    .eq('status', 'active');
    
  const balance = (userCredits || []).reduce((sum: number, c: any) => sum + (c.credits || 0), 0);

  // 4. Debug checkCredits logic
  let checkResult = null;
  try {
    checkResult = await checkCredits(order.user_id, true);
  } catch (e: any) {
    checkResult = { error: e.message, stack: e.stack };
  }

  return NextResponse.json({
    status: 'success',
    order: {
      order_no: order.order_no,
      status: order.status,
      amount: order.amount,
      credits_amount: order.credits_amount,
      user_id: order.user_id
    },
    credits_found: credits?.length || 0,
    credit_records: credits,
    user_balance_calculated: balance,
    check_credits_result: checkResult,
    diagnosis: credits?.length === 0 && order.status === 'paid' ? 'MISSING_CREDITS' : 'OK'
  });
}
