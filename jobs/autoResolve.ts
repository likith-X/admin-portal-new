/**
 * Auto-Resolve Expired Contests
 * 
 * Core logic for autonomous contest resolution.
 * 
 * Flow:
 * 1. Query database for contests past deadline and not resolved
 * 2. For each contest, call /api/resolve
 * 3. Resolver agent signs and submits to blockchain
 * 4. Update database with resolution result
 * 
 * This is the heart of the autonomous system.
 */

import { supabaseAdmin } from "../lib/supabaseAdmin";

/**
 * Auto-resolve all expired, unresolved contests
 */
export async function autoResolveExpiredContests() {
  console.log("\n🤖 Starting auto-resolution job...");
  console.log("Time:", new Date().toISOString());

  const now = new Date().toISOString();

  try {
    // Step 1: Fetch expired, unresolved contests
    const { data: contests, error } = await supabaseAdmin
      .from("contests")
      .select("id, question, deadline, status")
      .lt("deadline", now)
      .neq("status", "RESOLVED");

    if (error) {
      console.error("❌ Failed to fetch contests:", error);
      throw error;
    }

    if (!contests || contests.length === 0) {
      console.log("✅ No contests to auto-resolve");
      return { resolved: 0, failed: 0, total: 0 };
    }

    console.log(`📋 Found ${contests.length} contest(s) to resolve`);

    // Step 2: Resolve each contest
    let resolved = 0;
    let failed = 0;

    for (const contest of contests) {
      try {
        console.log(`\n🎯 Resolving contest #${contest.id}: "${contest.question}"`);
        console.log(`   Deadline was: ${contest.deadline}`);

        const appUrl = process.env.APP_URL || "http://localhost:3000";

        const response = await fetch(`${appUrl}/api/resolve`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            // Optional: Add authorization header for internal API calls
            // "Authorization": `Bearer ${process.env.INTERNAL_API_KEY}`
          },
          body: JSON.stringify({
            contestId: contest.id,
            criteria: contest.question
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`❌ Resolution failed for contest ${contest.id}:`, errorData);
          failed++;
          continue;
        }

        const result = await response.json() as any;
        console.log(`✅ Contest ${contest.id} resolved!`);
        console.log(`   Outcome: ${result.outcome ? "TRUE" : "FALSE"}`);
        console.log(`   Reasoning: ${result.reasoning}`);
        console.log(`   Tx: ${result.transactionHash}`);

        resolved++;

      } catch (err: any) {
        console.error(`❌ Error resolving contest ${contest.id}:`, err.message);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`📊 Auto-resolution complete`);
    console.log(`   ✅ Resolved: ${resolved}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📅 Total: ${contests.length}`);
    console.log("=".repeat(50) + "\n");

    return { resolved, failed, total: contests.length };

  } catch (error: any) {
    console.error("❌ Auto-resolution job failed:", error.message);
    throw error;
  }
}

/**
 * Get contests that need auto-resolution (utility function)
 */
export async function getExpiredContests() {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("contests")
    .select("id, question, deadline, status")
    .lt("deadline", now)
    .neq("status", "RESOLVED")
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Failed to fetch expired contests:", error);
    return [];
  }

  return data || [];
}
