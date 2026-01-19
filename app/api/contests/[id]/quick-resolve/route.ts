/**
 * Quick Resolve API
 * 
 * Manually trigger resolver agent for a specific contest
 * Perfect for short-duration contests (5-10 min price predictions)
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";
import { resolveWithAgent } from "@/services/resolverAgent";



export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params;

    // Fetch contest
    const { data: contest, error } = await supabaseAdmin
      .from("contests")
      .select("*")
      .eq("id", contestId)
      .single();

    if (error || !contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    if (contest.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Contest already resolved" },
        { status: 400 }
      );
    }

    console.log(`🤖 Quick resolving contest #${contest.contest_id_onchain}: ${contest.question}`);

    // Mock oracle data (replace with real data fetching in production)
    const oracleData = {
      facts: [
        `Contest: ${contest.question}`,
        `Deadline: ${new Date(contest.deadline).toLocaleDateString()}`,
        "Status: Expired, requires resolution",
      ],
      sources: ["Quick Resolve"],
    };

    // Use resolver agent to determine outcome with AI
    const resolution = await resolveWithAgent(
      contest.contest_id_onchain,
      contest.question,
      contest.resolution_criteria || contest.question,
      oracleData
    );

    if (!resolution) {
      throw new Error("Failed to get resolution from agent");
    }

    console.log(`🔏 Resolution: ${resolution.outcome ? "YES" : "NO"} (${resolution.resolverType})`);
    console.log(`💭 Explanation: ${resolution.explanation}`);

    // Submit to blockchain
    const oracle = getContestOracle();
    const tx = await oracle.resolveContest(
      contest.contest_id_onchain,
      resolution.outcome,
      resolution.signature
    );

    console.log(`📡 TX Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Confirmed at block ${receipt.blockNumber}`);

    // Update database with resolution metadata
    const updateData: any = {
      status: "RESOLVED",
      resolved_outcome: resolution.outcome,
      proof_uri: resolution.reasoning,
      resolved_at: new Date().toISOString(),
    };

    // Only add resolution_metadata if the column exists (optional)
    try {
      updateData.resolution_metadata = {
        explanation: resolution.explanation,
        confidence: resolution.confidence,
        evidence: resolution.evidence,
        sources: resolution.sources,
        resolverType: resolution.resolverType,
      };
    } catch (e) {
      console.log("⚠️ resolution_metadata column may not exist yet");
    }

    const { error: updateError } = await supabaseAdmin
      .from("contests")
      .update(updateData)
      .eq("id", contestId);

    if (updateError) {
      console.error("❌ Database update failed:", updateError);
      // Still return success since blockchain tx succeeded
    } else {
      console.log("✅ Database updated successfully");
    }

    return NextResponse.json({
      success: true,
      outcome: resolution.outcome,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      reasoning: resolution.reasoning,
      explanation: resolution.explanation,
      confidence: resolution.confidence,
      resolverType: resolution.resolverType,
    });

  } catch (error: any) {
    console.error("Quick resolve error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve contest" },
      { status: 500 }
    );
  }
}
