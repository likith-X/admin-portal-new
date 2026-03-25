import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params;
    const { outcome, proofURI = "MANUAL_RESOLUTION" } = await req.json();

    console.log(`📡 Manual resolution attempt for DB ID: ${contestId}`);

    // 1. Fetch contest from DB
    const { data: contest, error: dbError } = await supabaseAdmin
      .from("contests")
      .select("*")
      .eq("id", contestId)
      .single();

    if (dbError || !contest) {
      console.error("❌ Contest not found in database:", dbError);
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (!contest.contest_id_onchain) {
      console.error("❌ Contest has no on-chain ID associated");
      return NextResponse.json({ error: "Contest exists in DB but has no on-chain peer" }, { status: 400 });
    }

    // 2. Resolve on-chain
    console.log(`🚀 Resolving on-chain contest #${contest.contest_id_onchain} to ${outcome ? 'YES' : 'NO'}`);
    const oracle = getContestOracle();

    // Ensure we pass a BigInt or string for uint256
    const contestIdOnchain = BigInt(contest.contest_id_onchain);

    const tx = await oracle.resolveManual(
      contestIdOnchain,
      outcome,
      proofURI
    );

    console.log(`📡 TX Sent: ${tx.hash}. Waiting for confirmation...`);
    await tx.wait();
    console.log(`✅ TX Confirmed: ${tx.hash}`);

    // 3. Update DB
    const { error: updateError } = await supabaseAdmin
      .from("contests")
      .update({
        status: "RESOLVED",
        resolved_outcome: outcome,
        proof_uri: proofURI,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", contestId);

    if (updateError) {
      console.error("⚠️ TX succeeded but DB update failed:", updateError);
    }

    return NextResponse.json({ 
      success: true, 
      txHash: tx.hash,
      outcome: outcome 
    });

  } catch (error: any) {
    console.error("❌ Resolution failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve contest" },
      { status: 500 }
    );
  }
}
