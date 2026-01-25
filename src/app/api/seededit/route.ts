import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Test 1: Add auth import
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Test auth
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      message: "Test 1: auth import works!",
      hasSession: !!session,
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
    message: "Test 1: seededit with auth import",
    timestamp: new Date().toISOString(),
  });
}
