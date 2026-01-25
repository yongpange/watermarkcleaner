import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { checkUserCredits } from "@/lib/credits/check-legacy";
import { getClientIP, hashIPAddress } from "@/lib/security/ip-hash";

/**
 * API endpoint to check IP-based credits for unauthenticated users
 * GET /api/credits/check-ip
 */
export async function GET(request: NextRequest) {
  try {
    // Standardized IP extraction
    const ip = getClientIP(request);

    // Debug logs
    console.log('[Credits API] ===== Credit Check Started =====');
    console.log(`[Credits API] Raw IP: "${ip}"`);
    console.log(`[Credits API] Request headers:`, Object.fromEntries(request.headers.entries()));
    console.log(`[Credits API] IP Hash Salt: "${process.env.IP_HASH_SALT?.substring(0, 10)}..."`);

    const hashedIP = await hashIPAddress(ip);

    console.log(`[Credits API] Hashed IP: "${hashedIP}"`);
    console.log(`[Credits API] Hashed IP (first 10 chars): "${hashedIP.substring(0, 10)}..."`);
    console.log(`[Credits API] Full hashed IP length: ${hashedIP.length} chars`);

    // Check credits using IP as identifier for unauthenticated users
    console.log('[Credits API] Calling checkUserCredits...');
    const credits = await checkUserCredits(ip, false, undefined);

    console.log('[Credits API] Check result:', {
      tier: credits.tier,
      used: credits.used,
      limit: credits.limit,
      remaining: credits.remaining
    });

    console.log('[Credits API] ===== Credit Check Completed =====');

    return NextResponse.json(credits, {
      status: 200,
    });
  } catch (error) {
    console.error("[Credits API] Error checking IP credits:", error);

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
