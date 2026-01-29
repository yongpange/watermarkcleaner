
import { NextRequest, NextResponse } from 'next/server';
import { consumeCredits } from '@/lib/models/credit';
import { createAdminClient } from '@/lib/supabase-admin';
import { CreditTransactionScene } from '@/extensions/payment/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = '140c9c26-8b03-4522-be47-a9b57d3252ba';
  
  try {
    const supabase = createAdminClient();
    
    // Check balance first
    const { data: balanceData } = await supabase
      .from('wmc_credit')
      .select('credits')
      .eq('user_id', userId)
      .eq('status', 'active');
      
    const balance = (balanceData || []).reduce((sum: number, r: any) => sum + r.credits, 0);
    
    // Attempt consumption
    console.log(`[Debug] Attempting to consume 1 credit from user ${userId}. Current balance: ${balance}`);
    
    const result = await consumeCredits({
      userId,
      amount: 1,
      scene: CreditTransactionScene.IMAGE_PROCESSING,
      metadata: { description: 'Debug consumption' },
      supabaseClient: supabase
    });

    return NextResponse.json({
      success: true,
      previous_balance: balance,
      consumed_record: result
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
