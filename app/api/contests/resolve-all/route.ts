import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";
import { resolveWithAgent } from "@/services/resolverAgent";

/**
 * Resolve All Open Contests
 * Uses AI to resolve all open contests that have passed their deadline
 */
export async function POST() {
  try {
    // 1. Fetch all open contests that have passed deadline
    const now = new Date().toISOString();
    const { data: contests, error } = await supabaseAdmin
      .from("contests")
      .select("*")
      .eq("status", "OPEN")
      .lt("deadline", now)
      .order("deadline", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
    }

    if (!contests || contests.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "No open contests past deadline to resolve",
      });
    }

    const results = [];
    const errors = [];

    // 2. Resolve each contest
    for (const contest of contests) {
      try {
        console.log(`🤖 Resolving contest #${contest.contest_id_onchain}: ${contest.question}`);

        // Mock oracle data (in production, fetch real data)
        const oracleData = {
          facts: [
            `Contest: ${contest.question}`,
            `Deadline: ${new Date(contest.deadline).toLocaleDateString()}`,
            "Status: Analyzing",
          ],
          sources: ["CoinGecko", "NewsAPI"],
        };

        // Use resolver agent to determine outcome
        const resolution = await resolveWithAgent(
          contest.contest_id_onchain,
          contest.question,
          contest.resolution_criteria || contest.question,
          oracleData
        );

        if (!resolution) {
          throw new Error("Failed to get resolution from agent");
        }

        // Submit resolution on-chain
        const oracle = getContestOracle();
        const tx = await oracle.resolveContest(
          contest.contest_id_onchain,
          resolution.outcome,
          resolution.signature
        );

        const receipt = await tx.wait();

        // Update database with resolution metadata
        const updateData: any = {
          status: "RESOLVED",
          resolved_outcome: resolution.outcome,
          proof_uri: resolution.reasoning,
          resolved_at: new Date().toISOString(),
        };

        // Only add resolution_metadata if column exists
        try {
          updateData.resolution_metadata = {
            explanation: resolution.explanation,
            confidence: resolution.confidence,
            evidence: resolution.evidence,
            sources: resolution.sources,
            resolverType: resolution.resolverType,
          };
        } catch (e) {
          console.log("⚠️ resolution_metadata column may not exist");
        }

        const { error: dbError } = await supabaseAdmin
          .from("contests")
          .update(updateData)
          .eq("id", contest.id);

        if (dbError) {
          console.error(`❌ DB update error for contest #${contest.contest_id_onchain}:`, dbError);
        }

        results.push({
          contestId: contest.contest_id_onchain,
          question: contest.question,
          outcome: resolution.outcome ? "YES" : "NO",
          txHash: receipt.hash,
        });

        console.log(`✅ Resolved contest #${contest.contest_id_onchain} as ${resolution.outcome ? "YES" : "NO"}`);
      } catch (error: any) {
        console.error(`❌ Failed to resolve contest #${contest.contest_id_onchain}:`, error);
        
        // If already resolved on-chain, sync database
        if (error.message?.includes("Already resolved")) {
          console.log(`ℹ️  Contest #${contest.contest_id_onchain} already resolved on-chain, syncing database...`);
          await supabaseAdmin
            .from("contests")
            .update({
              status: "RESOLVED",
              resolved_at: new Date().toISOString(),
            })
            .eq("id", contest.id);
        }
        
        errors.push({
          contestId: contest.contest_id_onchain,
          question: contest.question,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully resolved ${results.length} contests${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    });
  } catch (error: any) {
    console.error("Error resolving all contests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve contests" },
      { status: 500 }
    );
  }
}
