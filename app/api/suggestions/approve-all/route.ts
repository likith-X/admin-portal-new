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

        // Call on-chain contract
        const tx = await oracle.createContest(
          suggestion.yes_no_question,
          deadline,
          resolutionType
        );

        console.log(`⏳ Waiting for tx ${tx.hash}...`);
        const receipt = await tx.wait(1); // Wait for 1 confirmation
        console.log(`✅ Confirmed in block ${receipt.blockNumber}`);

        // Extract contestId from event
        const event = receipt.logs
          .map((log: any) => {
            try {
              return oracle.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((e: any) => e?.name === "ContestCreated");

        if (!event || !event.args || !event.args.contestId) {
          throw new Error("Failed to extract contestId from transaction receipt");
        }

        const contestIdOnchain = event.args.contestId.toString();

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
