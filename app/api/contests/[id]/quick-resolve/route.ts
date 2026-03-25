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
import { fetchOracleData } from "@/lib/oracleDataFetcher";



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

    // Match contract guard: resolveContest() requires block.timestamp >= deadline when contest is OPEN.
    // Return a clear API error instead of a generic estimateGas revert.
    const nowMs = Date.now();
    const deadlineMs = new Date(contest.deadline).getTime();
    if (!Number.isFinite(deadlineMs)) {
      return NextResponse.json(
        { error: "Invalid contest deadline in database" },
        { status: 400 }
      );
    }

    if (nowMs < deadlineMs) {
      return NextResponse.json(
        {
          error: "Contest deadline not reached",
          details: {
            now: new Date(nowMs).toISOString(),
            deadline: new Date(deadlineMs).toISOString(),
            secondsRemaining: Math.ceil((deadlineMs - nowMs) / 1000),
          },
        },
        { status: 400 }
      );
    }

    console.log(`🤖 Quick resolving contest #${contest.contest_id_onchain}: ${contest.question}`);

    // Fetch real oracle data (crypto prices, news, etc.)
    console.log(`📊 Fetching real-time oracle data...`);
    const oracleData = await fetchOracleData(contest.question);
    console.log(`📊 Got ${oracleData.facts.length} facts from ${oracleData.sources.join(', ')}`);

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

    // Preflight call to capture exact revert reason (e.g. invalid signature, wrong signer, already resolved)
    await oracle.resolveContest.staticCall(
      contest.contest_id_onchain,
      resolution.outcome,
      resolution.signature
    );

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
