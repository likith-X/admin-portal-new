import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

/**
 * Manual Resolution Endpoint (Admin Only)
 * Allows developers to force resolve a market for testing.
 */
export async function POST(req: Request) {
  try {
    const { contestId, choice } = await req.json();

    if (!contestId || !choice) {
      return NextResponse.json({ error: "contestId and choice are required" }, { status: 400 });
    }

    const oracle = getContestOracle();
    
    console.log(`⚖️ Resolving market #${contestId} to win ${choice === 1 ? 'YES' : 'NO'}`);
    const tx = await oracle.resolveContest(Number(contestId), Number(choice));
    const receipt = await tx.wait();

    console.log(`✅ Market #${contestId} resolved on-chain. TX: ${receipt.hash}`);

    // Update DB
    const { error: updateError } = await supabaseAdmin
      .from("contests")
      .update({
        status: "RESOLVED",
        outcome: choice, // 1 = YES, 2 = NO
        resolved: true,
      })
      .eq("id", contestId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      contestId,
      txHash: receipt.hash,
      outcome: choice === 1 ? "YES" : "NO"
    });

  } catch (error: any) {
    console.error("❌ Manual resolution failed:", error);
    return NextResponse.json(
      { error: error.message || "Manual resolution failed" },
      { status: 500 }
    );
  }
}
