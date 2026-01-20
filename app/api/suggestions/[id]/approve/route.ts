import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: suggestionId } = await params;

    console.log(`🔄 Approving suggestion: ${suggestionId}`);

    // 1. Fetch suggestion
    const { data: suggestion, error } = await supabaseAdmin
      .from("suggested_contents")
      .select("*")
      .eq("id", suggestionId)
      .single();

    if (error || !suggestion) {
      console.error("Suggestion not found:", error);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log(`📝 Suggestion found: ${suggestion.yes_no_question}`);

    // 2. Define deadline (example: +7 days)
    const deadline = Math.floor(
      (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000
    );

    // ADMIN_ORACLE = 1
    const resolutionType = 1;

    // 3. Call on-chain contract
    console.log("📡 Calling smart contract...");
    const oracle = getContestOracle();

    // Get current nonce to avoid conflicts
    const wallet = oracle.runner;
    const nonce = await wallet.provider.getTransactionCount(wallet.address, 'pending');
    console.log(`🔢 Using nonce: ${nonce}`);

    const tx = await oracle.createContest(
      suggestion.yes_no_question,
      deadline,
      resolutionType,
      { nonce } // Explicitly set nonce
    );

    console.log(`⏳ Waiting for transaction: ${tx.hash}`);
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`📄 Receipt logs count: ${receipt.logs.length}`);

    // 4. Extract contestId from event
    console.log("🔍 Parsing transaction logs...");
    const parsedEvents = receipt.logs
      .map((log: any, index: number) => {
        try {
          const parsed = oracle.interface.parseLog(log);
          console.log(`Log ${index}: ${parsed?.name || 'unknown'}`);
          return parsed;
        } catch (e) {
          console.log(`Log ${index}: Could not parse (likely not from our contract)`);
          return null;
        }
      })
      .filter((e: any) => e !== null);

    console.log(`📝 Found ${parsedEvents.length} parseable events`);
    
    const event = parsedEvents.find((e: any) => e?.name === "ContestCreated");

    if (!event) {
      console.error("❌ No ContestCreated event found in transaction");
      console.error("Available events:", parsedEvents.map((e: any) => e?.name));
      throw new Error("Failed to find ContestCreated event in transaction receipt");
    }

    if (!event.args || !event.args.contestId) {
      console.error("❌ ContestCreated event found but missing contestId");
      console.error("Event args:", event.args);
      throw new Error("ContestCreated event is missing contestId argument");
    }

    const contestIdOnchain = event.args.contestId.toString();
    console.log(`🎯 Contest created on-chain: #${contestIdOnchain}`);

    // 5. Save contest in DB
    console.log("💾 Saving contest to database...");
    const { error: insertError } = await supabaseAdmin.from("contests").insert({
      suggestion_id: suggestion.id,
      contest_id_onchain: contestIdOnchain,
      question: suggestion.yes_no_question,
      deadline: new Date(deadline * 1000).toISOString(),
      resolution_type: "ADMIN_ORACLE",
      tx_hash: receipt.hash,
      status: "OPEN",
    });

    if (insertError) {
      console.error("Failed to insert contest:", insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // 6. Mark suggestion as used
    console.log("✏️ Marking suggestion as used...");
    const { error: updateError } = await supabaseAdmin
      .from("suggested_contents")
      .update({ status: "used" })
      .eq("id", suggestion.id);

    if (updateError) {
      console.error("Failed to update suggestion:", updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log(`✅ Successfully approved suggestion ${suggestionId}`);

    return NextResponse.json({
      success: true,
      contestId: contestIdOnchain,
      txHash: receipt.hash,
      question: suggestion.yes_no_question,
    });
  } catch (error: any) {
    console.error("❌ Approve suggestion error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to approve suggestion",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
