import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Test 4: Add all imports including payment/types
import { auth } from "@/auth";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { checkUserCredits, USER_TIER_CONFIG } from "@/lib/credits/check-legacy";
import { CreditTransactionScene } from '@/extensions/payment/types';

export async function POST(request: NextRequest) {
  try {
    // Test rate limit
    const rateLimitResult = await rateLimitMiddleware(request, {
      limit: 10,
      windowMs: 3600000,
    });
    
    // Test auth
    const session = await auth();
    
    // Test credits
    const userIdentifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "test-ip";
    const credits = await checkUserCredits(userIdentifier, false);
    
    // Test payment types
    const scene: CreditTransactionScene = CreditTransactionScene.IMAGE_PROCESSING;
    
    return NextResponse.json({
      success: true,
      message: "Test 4: ALL imports work!",
      hasSession: !!session,
      credits: credits,
      scene: scene,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Test 4: seededit with ALL imports",
    timestamp: new Date().toISOString(),
  });
}
