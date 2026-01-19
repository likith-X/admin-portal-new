import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: suggestionId } = await params;

  // 1. Fetch suggestion
  const { data: suggestion, error } = await supabaseAdmin
    .from("suggested_contents")
    .select("*")
    .eq("id", suggestionId)
    .single();

  if (error || !suggestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Define deadline (example: +7 days)
  const deadline = Math.floor(
    (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000
  );

  // ADMIN_ORACLE = 1
  const resolutionType = 1;

  // 3. Call on-chain contract
  const oracle = getContestOracle();

  const tx = await oracle.createContest(
    suggestion.yes_no_question,
    deadline,
    resolutionType
  );

  const receipt = await tx.wait();

  // 4. Extract contestId from event
  const event = receipt.logs
    .map((log: any) => {
      try {
        return oracle.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e?.name === "ContestCreated");

  const contestIdOnchain = event.args.contestId.toString();

  // 5. Save contest in DB
  await supabaseAdmin.from("contests").insert({
    suggestion_id: suggestion.id,
    contest_id_onchain: contestIdOnchain,
    question: suggestion.yes_no_question,
    deadline: new Date(deadline * 1000).toISOString(),
    resolution_type: "ADMIN_ORACLE",
    tx_hash: receipt.hash
  });

  // 6. Mark suggestion as used
  await supabaseAdmin
    .from("suggested_contents")
    .update({ status: "used" })
    .eq("id", suggestion.id);

  return NextResponse.json({
    success: true,
    contestId: contestIdOnchain,
    txHash: receipt.hash
  });
}
