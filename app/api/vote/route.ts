import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Vote API
 * 
 * Allows logged-in users to vote YES/NO on open contests.
 * 
 * Validations:
 * - Contest exists
 * - Contest not resolved
 * - Deadline not passed
 * - User hasn't voted yet (enforced by unique constraint)
 * 
 * Flow:
 * 1. Validate input
 * 2. Check contest status
 * 3. Insert vote (or return error if duplicate)
 */

export async function POST(req: Request) {
  try {
    const { contestId, userId, vote } = await req.json();

    // Validate required fields
    if (!contestId || !userId || !vote) {
      return NextResponse.json(
        { error: "Missing required fields: contestId, userId, vote" },
        { status: 400 }
      );
    }

    // Validate vote value
    if (!["YES", "NO"].includes(vote)) {
      return NextResponse.json(
        { error: "Invalid vote. Must be YES or NO" },
        { status: 400 }
      );
    }

    // Fetch contest details
    const { data: contest, error: contestError } = await supabaseAdmin
      .from("contests")
      .select("id, deadline, status")
      .eq("id", contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Check if contest is resolved
    if (contest.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Contest already resolved. Voting is closed." },
        { status: 403 }
      );
    }

    // Check if deadline has passed
    const now = new Date();
    const deadline = new Date(contest.deadline);
    
    if (deadline < now) {
      return NextResponse.json(
        { error: "Voting deadline has passed" },
        { status: 403 }
      );
    }

    // Insert vote
    const { data: voteData, error: voteError } = await supabaseAdmin
      .from("votes")
      .insert({
        contest_id: contestId,
        user_id: userId,
        vote
      })
      .select()
      .single();

    if (voteError) {
      // Check for unique constraint violation
      if (voteError.code === "23505") {
        return NextResponse.json(
          { error: "You have already voted on this contest" },
          { status: 409 }
        );
      }

      console.error("Vote insertion error:", voteError);
      return NextResponse.json(
        { error: "Failed to record vote" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vote: {
        id: voteData.id,
        contestId: voteData.contest_id,
        userId: voteData.user_id,
        vote: voteData.vote,
        createdAt: voteData.created_at
      }
    });

  } catch (err: any) {
    console.error("Vote API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve user's vote for a contest
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get("contestId");
    const userId = searchParams.get("userId");

    if (!contestId || !userId) {
      return NextResponse.json(
        { error: "Missing contestId or userId" },
        { status: 400 }
      );
    }

    const { data: vote, error } = await supabaseAdmin
      .from("votes")
      .select("*")
      .eq("contest_id", contestId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No vote found
        return NextResponse.json({ vote: null });
      }
      throw error;
    }

    return NextResponse.json({
      vote: {
        id: vote.id,
        contestId: vote.contest_id,
        userId: vote.user_id,
        vote: vote.vote,
        createdAt: vote.created_at
      }
    });

  } catch (err: any) {
    console.error("Get vote error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve vote" },
      { status: 500 }
    );
  }
}
