import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

/**
 * Approve All Pending Suggestions
 * Creates on-chain contests for all pending suggestions
 */
export async function POST() {
  try {
    // 1. Fetch all pending suggestions
    const { data: suggestions, error } = await supabaseAdmin
      .from("suggested_contents")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json({ 
        success: true,
        count: 0,
        message: "No pending suggestions to approve" 
      });
    }

    const oracle = getContestOracle();
    const results = [];
    const errors = [];

    console.log(`📊 Processing ${suggestions.length} suggestions sequentially...`);

    // Get the wallet address and initial nonce
    const signer = oracle.runner;
    if (!signer || !('getAddress' in signer) || !signer.provider) {
      throw new Error("Oracle contract not properly initialized with signer");
    }
    
    const signerAddress = await (signer as any).getAddress();
    let currentNonce = await signer.provider.getTransactionCount(signerAddress, "pending");
    console.log(`🔢 Starting nonce: ${currentNonce}`);

    // 2. Create contests for each suggestion (SEQUENTIALLY to avoid nonce conflicts)
    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      try {
        console.log(`\n[${i + 1}/${suggestions.length}] Processing: ${suggestion.yes_no_question.substring(0, 50)}...`);

        // Define deadline (example: +7 days from now)
        const deadline = Math.floor(
          (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000
        );

        // ADMIN_ORACLE = 1
        const resolutionType = 1;

        // Call on-chain contract with explicit nonce
        const tx = await oracle.createContest(
          suggestion.yes_no_question,
          deadline,
          resolutionType,
          { nonce: currentNonce }
        );

        console.log(`⏳ Waiting for tx ${tx.hash} (nonce: ${currentNonce})...`);
        const receipt = await tx.wait(1); // Wait for 1 confirmation
        console.log(`✅ Confirmed in block ${receipt.blockNumber}`);

        // Increment nonce for next transaction
        currentNonce++;
        
        // Small delay to ensure nonce is properly updated on the network
        await new Promise(resolve => setTimeout(resolve, 500));

        // Extract contestId from event with fallback strategies
        let contestIdOnchain: string | null = null;
        
        // Try to parse event from logs
        for (const log of receipt.logs) {
          try {
            const parsed = oracle.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            
            if (parsed && parsed.name === "ContestCreated" && parsed.args?.contestId) {
              contestIdOnchain = parsed.args.contestId.toString();
              console.log(`✅ Extracted contestId from event: ${contestIdOnchain}`);
              break;
            }
          } catch (e) {
            // Continue to next log
          }
        }

        // Fallback: Query contract for contestCount
        if (!contestIdOnchain) {
          try {
            console.log("⚠️ Event parsing failed, querying contract...");
            
            // Verify contract exists
            const contractAddress = await oracle.getAddress();
            const code = await oracle.runner?.provider?.getCode(contractAddress);
            if (!code || code === '0x') {
              throw new Error(`No contract at ${contractAddress}`);
            }
            
            const count = await oracle.contestCount();
            console.log(`📊 contestCount returned: ${count}`);
            
            if (count.toString() === '0') {
              throw new Error("contestCount is 0 - contract may not be initialized");
            }
            
            contestIdOnchain = count.toString();
            console.log(`✅ Got contestId from contestCount: ${contestIdOnchain}`);
          } catch (e: any) {
            console.error("❌ Cannot determine contestId:", e.message);
            throw new Error(`Failed to extract contestId: ${e.message}. Transaction succeeded but cannot save to database without valid ID.`);
          }
        }

        if (!contestIdOnchain || isNaN(Number(contestIdOnchain))) {
          throw new Error(`Invalid contestId: ${contestIdOnchain}. Cannot insert into database.`);
        }

        // Save contest in DB
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
          throw new Error(`Failed to insert contest: ${insertError.message}`);
        }

        // Mark suggestion as used
        const { error: updateError } = await supabaseAdmin
          .from("suggested_contents")
          .update({ status: "used" })
          .eq("id", suggestion.id);

        if (updateError) {
          throw new Error(`Failed to update suggestion: ${updateError.message}`);
        }

        results.push({
          suggestionId: suggestion.id,
          contestId: contestIdOnchain,
          txHash: receipt.hash,
          question: suggestion.yes_no_question,
        });

        console.log(`✅ Created contest #${contestIdOnchain} from suggestion ${suggestion.id}`);
      } catch (error: any) {
        console.error(`❌ Failed to create contest for suggestion ${suggestion.id}:`, error);
        errors.push({
          suggestionId: suggestion.id,
          question: suggestion.yes_no_question,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully created ${results.length} contests${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    });
  } catch (error: any) {
    console.error("Error approving all suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve suggestions" },
      { status: 500 }
    );
  }
}
