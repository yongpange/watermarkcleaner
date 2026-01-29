import { NextResponse } from "next/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { auth } from "@/auth";
import { checkCredits } from "@/lib/credits/check";

/**
 * API endpoint to check user's credits
 * GET /api/credits/check
 */
export async function GET(_request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get raw IP for credit check consistency (Available in request headers if needed later)
    const credits = await checkCredits(session.user.id, true);

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
