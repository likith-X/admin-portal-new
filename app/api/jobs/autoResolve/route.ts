import { NextResponse } from "next/server";
import { autoResolveExpiredContests } from "@/jobs/autoResolve";

/**
 * Auto-Resolve Job API Endpoint
 * 
 * This endpoint triggers the auto-resolution job.
 * 
 * Usage:
 * - GitHub Actions cron
 * - Server cron (curl)
 * - Manual testing
 * 
 * Security:
 * In production, add authentication:
 * - Check bearer token
 * - Verify internal API key
 * - Rate limit
 */

export async function POST(req: Request) {
  try {
    // Optional: Add authentication
    // const authHeader = req.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    console.log("🚀 Auto-resolve job triggered via API");

    const result = await autoResolveExpiredContests();

    return NextResponse.json({
      success: true,
      message: "Auto-resolution completed",
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Auto-resolve job failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Auto-resolution failed",
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking status
 */
export async function GET() {
  try {
    // Just check how many contests need resolution
    const { getExpiredContests } = await import("@/jobs/autoResolve");
    const expired = await getExpiredContests();

    return NextResponse.json({
      pendingResolutions: expired.length,
      contests: expired.map(c => ({
        id: c.id,
        question: c.question,
        deadline: c.deadline
      }))
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
