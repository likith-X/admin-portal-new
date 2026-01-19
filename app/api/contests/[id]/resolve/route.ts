import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contestId } = await params;
  const { outcome, proofURI } = await req.json();

  // 1. Fetch contest
  const { data: contest } = await supabaseAdmin
    .from("contests")
    .select("*")
    .eq("id", contestId)
    .single();

  if (!contest) {
    return NextResponse.json({ error: "Contest not found" }, { status: 404 });
  }

  // 2. Resolve on-chain
  const oracle = getContestOracle();

  const tx = await oracle.resolveManual(
    contest.contest_id_onchain,
    outcome,
    proofURI
  );

  await tx.wait();

  // 3. Update DB
  await supabaseAdmin
    .from("contests")
    .update({
      status: "RESOLVED",
      resolved_outcome: outcome,
      proof_uri: proofURI,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", contestId);

  return NextResponse.json({ success: true, txHash: tx.hash });
}
