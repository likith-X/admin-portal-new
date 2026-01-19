import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

/**
 * Sync Contest Status with Blockchain
 * 
 * Checks on-chain resolution status and updates database accordingly
 */
export async function POST() {
  try {
    const oracle = getContestOracle();
    
    // Fetch all OPEN contests from database
    const { data: contests, error } = await supabaseAdmin
      .from("contests")
      .select("*")
      .eq("status", "OPEN");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
    }

    if (!contests || contests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No open contests to sync",
        synced: 0,
      });
    }

    let syncedCount = 0;
    const results = [];

    for (const contest of contests) {
      try {
        // Try to read the contest state from blockchain
        // Since we don't have a getter in the ABI, we'll try to resolve and catch the error
        console.log(`🔍 Checking contest #${contest.contest_id_onchain}...`);
        
        // Attempt to call resolveContest - if it reverts with "Already resolved", we know it's resolved
        const testSignature = "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        
        try {
          await oracle.resolveContest.staticCall(
            contest.contest_id_onchain,
            true,
            testSignature
          );
        } catch (e: any) {
          if (e.message?.includes("Already resolved")) {
            console.log(`✅ Contest #${contest.contest_id_onchain} is resolved on-chain, updating DB...`);
            
            // Update database to RESOLVED
            await supabaseAdmin
              .from("contests")
              .update({
                status: "RESOLVED",
                resolved_at: new Date().toISOString(),
              })
              .eq("id", contest.id);
            
            syncedCount++;
            results.push({
              contestId: contest.contest_id_onchain,
              question: contest.question,
              status: "Synced - marked as RESOLVED",
            });
          }
        }
      } catch (error: any) {
        console.error(`Failed to check contest #${contest.contest_id_onchain}:`, error);
        results.push({
          contestId: contest.contest_id_onchain,
          question: contest.question,
          status: "Error checking status",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} contests`,
      synced: syncedCount,
      results,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync contests" },
      { status: 500 }
    );
  }
}
