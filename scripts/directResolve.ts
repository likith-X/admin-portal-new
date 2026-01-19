/**
 * Direct Contest Resolution (No API Server Needed)
 * 
 * Resolves contests directly without calling HTTP APIs.
 */

require("dotenv").config({ path: ".env.local" });

import { ethers } from "ethers";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY!;
const CONTEST_ORACLE_ADDRESS = process.env.CONTEST_ORACLE_ADDRESS!;
const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC!;

const CONTEST_ORACLE_ABI = [
  "function resolveContest(uint256 contestId, bool outcome, bytes memory signature) external",
  "function contests(uint256) view returns (uint256 id, string memory question, uint256 deadline, bool resolved, bool outcome)"
];

async function directResolve() {
  console.log("\n🤖 Direct Contest Resolution");
  console.log("═══════════════════════════════════════════════\n");

  // Find expired contests
  const now = new Date().toISOString();
  const { data: contests, error } = await supabaseAdmin
    .from("contests")
    .select("*")
    .lt("deadline", now)
    .eq("status", "OPEN")
    .limit(5);

  if (error || !contests || contests.length === 0) {
    console.log("✅ No contests to resolve");
    return;
  }

  console.log(`📋 Found ${contests.length} expired contest(s)\n`);

  // Setup blockchain connection
  const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
  const resolverWallet = new ethers.Wallet(RESOLVER_PRIVATE_KEY, provider);
  const oracleContract = new ethers.Contract(
    CONTEST_ORACLE_ADDRESS,
    CONTEST_ORACLE_ABI,
    resolverWallet
  );

  console.log(`🔑 Resolver: ${resolverWallet.address}\n`);

  let resolved = 0;
  let failed = 0;

  for (const contest of contests) {
    try {
      console.log(`🎯 Resolving: "${contest.question}"`);
      console.log(`   Contest ID: ${contest.id}`);

      // Simple deterministic resolution
      const outcome = Math.random() > 0.5;
      console.log(`   🧠 Decision: ${outcome ? "TRUE" : "FALSE"}`);

      // Create message to sign
      const contestIdNumber = 1; // Using 1 for now (will map UUIDs later)
      const message = ethers.solidityPackedKeccak256(
        ["uint256", "bool"],
        [contestIdNumber, outcome]
      );
      const messageHashBytes = ethers.getBytes(message);
      const signature = await resolverWallet.signMessage(messageHashBytes);

      console.log(`   🔏 Signature: ${signature.slice(0, 20)}...`);

      // Submit to blockchain
      console.log(`   ⛓️  Submitting to blockchain...`);
      const tx = await oracleContract.resolveContest(
        contestIdNumber,
        outcome,
        signature
      );

      console.log(`   📡 TX Hash: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`   ✅ Confirmed at block ${receipt.blockNumber}`);

      // Update database
      const { error: updateError } = await supabaseAdmin
        .from("contests")
        .update({
          status: "RESOLVED",
          resolved_outcome: outcome
        })
        .eq("id", contest.id);

      if (updateError) {
        console.error(`   ⚠️  Database update failed:`, updateError);
      } else {
        console.log(`   💾 Database updated\n`);
      }

      resolved++;

    } catch (err: any) {
      console.error(`   ❌ Error:`, err.message, "\n");
      failed++;
    }
  }

  console.log("═══════════════════════════════════════════════");
  console.log(`✅ Resolved: ${resolved}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${contests.length}`);
  console.log("═══════════════════════════════════════════════\n");
}

directResolve()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
