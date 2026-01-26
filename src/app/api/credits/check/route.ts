import { NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { checkCredits } from "@/lib/credits/check-legacy";

/**
 * API endpoint to check user's credits
 * GET /api/credits/check
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get raw IP for credit check consistency
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";

    // Pass clientIp to correctly link anonymous usage to the authenticated user
    const credits = await checkCredits(session.user.id, clientIp);

    return NextResponse.json(credits, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Failed to check credits:", error);

    return NextResponse.json(
      {
        error: "Failed to check credits",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
