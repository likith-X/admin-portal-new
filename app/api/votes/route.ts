import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Votes API - Retrieve voting data
 * 
 * Endpoints:
 * - GET /api/votes?contestId=xxx - Get all votes for a contest
 * - GET /api/votes?contestId=xxx&summary=true - Get vote counts
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get("contestId");
    const summary = searchParams.get("summary") === "true";

    if (!contestId) {
      return NextResponse.json(
        { error: "contestId is required" },
        { status: 400 }
      );
    }

    if (summary) {
      // Return vote counts
      const { data: votes, error } = await supabaseAdmin
        .from("votes")
        .select("vote")
        .eq("contest_id", contestId);

      if (error) {
        throw error;
      }

      const yesVotes = votes?.filter(v => v.vote === "YES").length || 0;
      const noVotes = votes?.filter(v => v.vote === "NO").length || 0;
      const totalVotes = yesVotes + noVotes;

      return NextResponse.json({
        contestId,
        summary: {
          yes: yesVotes,
          no: noVotes,
          total: totalVotes,
          yesPercentage: totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0,
          noPercentage: totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 0
        }
      });
    }

    // Return all votes (without user details for privacy)
    const { data: votes, error } = await supabaseAdmin
      .from("votes")
      .select("id, vote, created_at")
      .eq("contest_id", contestId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      contestId,
      votes: votes || [],
      count: votes?.length || 0
    });

  } catch (err: any) {
    console.error("Votes API error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve votes" },
      { status: 500 }
    );
  }
}
