import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveWithAgent } from "@/services/resolverAgent";

/**
 * Simulate Resolution (Dry Run)
 * 
 * Previews AI decision WITHOUT committing on-chain.
 * This is how professional oracle operators work.
 */
export async function POST(request: Request) {
  try {
    const { contestId } = await request.json();

    if (!contestId) {
      return NextResponse.json({ error: "Contest ID required" }, { status: 400 });
    }

    // 1. Fetch contest
    const { data: contest, error } = await supabaseAdmin
      .from("contests")
      .select("*")
      .eq("id", contestId)
      .single();

    if (error || !contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (contest.status !== "OPEN") {
      return NextResponse.json({ error: "Contest already resolved" }, { status: 400 });
    }

    // 2. Fetch oracle data (mock for now)
    const oracleData = {
      facts: [
        `Contest question: ${contest.question}`,
        `Deadline: ${new Date(contest.deadline).toLocaleDateString()}`,
        `Current status: Analyzing available data sources`,
        `Resolution criteria: ${contest.resolution_criteria || "Standard verification"}`,
      ],
      sources: [
        "CoinGecko API",
        "NewsAPI",
        "Official announcements",
      ],
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    };

    // 3. Run resolver agent (WITHOUT signing for real)
    const resolution = await resolveWithAgent(
      contest.contest_id_onchain,
      contest.question,
      contest.resolution_criteria || contest.question,
      oracleData
    );

    // 4. Return simulation result (NO database changes, NO on-chain tx)
    return NextResponse.json({
      success: true,
      simulation: true,
      contestId: contest.contest_id_onchain,
      question: contest.question,
      predictedOutcome: resolution.outcome,
      outcomeLabel: resolution.outcome ? "YES" : "NO",
      confidence: resolution.confidence,
      confidencePercent: `${(resolution.confidence * 100).toFixed(1)}%`,
      explanation: resolution.explanation,
      evidence: resolution.evidence,
      sources: resolution.sources,
      resolverType: resolution.resolverType,
      reasoning: resolution.reasoning,
      signaturePreview: resolution.signature.slice(0, 20) + "...",
      warning: "This is a simulation. No on-chain transaction will be made.",
    });
  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to simulate resolution" },
      { status: 500 }
    );
  }
}
