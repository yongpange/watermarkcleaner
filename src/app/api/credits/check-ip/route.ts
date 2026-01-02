import { NextRequest, NextResponse } from "next/server";
import { checkUserCredits } from "@/lib/credits/check";
import { getClientIP, hashIPAddress } from "@/lib/security/ip-hash";

/**
 * API endpoint to check IP-based credits for unauthenticated users
 * GET /api/credits/check-ip
 */
export async function GET(request: NextRequest) {
  try {
    // Standardized IP extraction
    const ip = getClientIP(request);
    const hashedIP = hashIPAddress(ip);

    console.log(`[IP DEBUG] check-ip: Raw="${ip}", Hashed="${hashedIP.substring(0, 10)}..."`);

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
