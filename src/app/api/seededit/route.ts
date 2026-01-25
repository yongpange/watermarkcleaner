import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 最小化测试版本 - 仅用于诊断 404 问题
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Seededit API is working! This is a test response.",
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Seededit API GET is working!",
    timestamp: new Date().toISOString(),
  });
}
