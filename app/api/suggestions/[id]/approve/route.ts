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

    if (!oracle) {
      return NextResponse.json(
        { error: "Oracle not initialized" },
        { status: 500 }
      );
    }

    const tx = await oracle.createContest(
      suggestion.yes_no_question,
      deadline,
      resolutionType
    );

    console.log(`⏳ Waiting for transaction: ${tx.hash}`);
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`📄 Receipt logs count: ${receipt.logs.length}`);

    // 4. Extract contestId from event
    console.log("🔍 Parsing transaction logs...");
    
    let contestIdOnchain: string | null = null;
    
    // Try to parse events
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      try {
        const parsed = oracle.interface.parseLog(log);
        console.log(`Log ${i}: ${parsed?.name || 'unknown'}`);
        
        if (parsed?.name === "ContestCreated" && parsed.args?.contestId) {
          contestIdOnchain = parsed.args.contestId.toString();
          console.log(`✅ Found ContestCreated event with ID: ${contestIdOnchain}`);
          break;
        }
      } catch (e) {
        console.log(`Log ${i}: Could not parse`);
      }
    }

    // If event parsing failed, try to get the contestCount from the contract
    if (!contestIdOnchain) {
      try {
        console.log("⚠️ Event parsing failed, querying contract for contestCount...");
        
        // Verify contract is deployed
        const contractAddress = await oracle.getAddress();
        const code = await oracle.runner?.provider?.getCode(contractAddress);
        console.log(`📝 Contract at ${contractAddress}, code length: ${code?.length || 0}`);
        
        if (!code || code === '0x') {
          throw new Error(`No contract deployed at ${contractAddress}. Check CONTEST_ORACLE_ADDRESS in environment variables.`);
        }
        
        const count = await oracle.contestCount();
        console.log(`📊 contestCount returned: ${count}`);
        
        if (count.toString() === '0') {
          throw new Error("contestCount is 0 - this may be the first contest or contract not initialized");
        }
        
        contestIdOnchain = count.toString();
        console.log(`✅ Got contestId from contestCount: ${contestIdOnchain}`);
      } catch (e: any) {
        console.error("❌ Failed to get contestId:", e.message);
        console.error("Full error:", e);
        throw new Error(`Cannot determine contest ID after transaction. Error: ${e.message}. Please verify contract address and RPC endpoint.`);
      }
    }
    
    if (!contestIdOnchain || isNaN(Number(contestIdOnchain))) {
      throw new Error(`Invalid contest ID: ${contestIdOnchain}. Cannot save to database.`);
    }
    
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
      social_buzz_score: suggestion.social_buzz_score || 0,
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
