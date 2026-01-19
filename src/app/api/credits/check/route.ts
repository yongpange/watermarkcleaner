import { NextResponse } from "next/server";
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

    const credits = await checkCredits(session.user.id);

    return NextResponse.json(credits, {
      status: 200,
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
