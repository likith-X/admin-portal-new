import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

/**
 * Create a Manual Test Contest
 * Bypasses suggestions and creates a direct on-chain test market
 */
export async function POST(req: Request) {
  try {
    const { question, headline } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const oracle = getContestOracle();
    
    // Deadline: Set to 1 minute in the past for tests to allow for 
    // IMMEDIATE manual resolution testing.
    const deadline = Math.floor((Date.now() - 60 * 1000) / 1000);
    const resolutionType = 1; // ADMIN_ORACLE

    console.log("🚀 Creating on-chain TEST contest...");
    const tx = await oracle.createContest(question, deadline, resolutionType);
    const receipt = await tx.wait();

    // Parse contest ID
    let contestIdOnchain = "";
    for (const log of receipt.logs) {
      try {
        const parsed = oracle.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
        if (parsed && parsed.name === "ContestCreated" && parsed.args?.contestId) {
          contestIdOnchain = parsed.args.contestId.toString();
          break;
        }
      } catch (e) {}
    }

    if (!contestIdOnchain) {
      // Fallback: Query contestCount
      const count = await oracle.contestCount();
      contestIdOnchain = count.toString();
    }

    // Insert into DB with IS_TEST: TRUE
    const { data: contest, error } = await supabaseAdmin.from("contests").insert({
      contest_id_onchain: contestIdOnchain,
      question: question,
      deadline: new Date(deadline * 1000).toISOString(),
      resolution_type: "ADMIN_ORACLE",
      tx_hash: receipt.hash,
      status: "OPEN",
      is_test: true, // IMPORTANT
    }).select().single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      contestId: contestIdOnchain,
      txHash: receipt.hash,
      dbId: contest.id
    });

  } catch (error: any) {
    console.error("❌ Test contest creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create test market" },
      { status: 500 }
    );
  }
}
