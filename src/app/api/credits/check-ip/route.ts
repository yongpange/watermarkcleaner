import { NextRequest, NextResponse } from "next/server";
import { checkUserCredits } from "@/lib/credits/check";

/**
 * API endpoint to check IP-based credits for unauthenticated users
 * GET /api/credits/check-ip
 */
export async function GET(request: NextRequest) {
  try {
    // Get IP address from request headers
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown-ip";

    // Check credits using IP as identifier for unauthenticated users
    const credits = await checkUserCredits(ip, false, undefined);

    return NextResponse.json(credits, {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to check IP credits:", error);

    // Return default unverified tier on error
    return NextResponse.json(
      {
        tier: "unverified",
        used: 0,
        limit: 3,
        remaining: 3,
      },
      { status: 200 }  // Return 200 with default value instead of error
    );
  }
}
