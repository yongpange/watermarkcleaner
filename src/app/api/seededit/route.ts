import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Test 2: Add auth + rate-limit imports
import { auth } from "@/auth";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Test rate limit
    const rateLimitResult = await rateLimitMiddleware(request, {
      limit: 10,
      windowMs: 3600000,
    });
    
    // Test auth
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      message: "Test 2: auth + rate-limit imports work!",
      hasSession: !!session,
      rateLimit: rateLimitResult.remaining,
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
    message: "Test 2: seededit with auth + rate-limit imports",
    timestamp: new Date().toISOString(),
  });
}
