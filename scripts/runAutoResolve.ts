/**
 * Run Auto-Resolve Job Locally
 * 
 * This script allows you to test the auto-resolution job
 * locally before setting up cron/scheduled jobs.
 * 
 * Usage:
 *   npx ts-node scripts/runAutoResolve.ts
 * 
 * Prerequisites:
 *   - .env.local configured with all required variables
 *   - Contests exist in database with past deadlines
 *   - Resolver wallet configured and authorized on-chain
 *   - Admin app server NOT required (direct DB access)
 */

const dotenv = require("dotenv");
const { resolve } = require("path");

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Verify required environment variables
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESOLVER_PRIVATE_KEY",
  "RESOLVER_ADDRESS",
  "CONTEST_ORACLE_ADDRESS",
  "BASE_MAINNET_RPC",
  "APP_URL"
];

console.log("🔍 Checking environment variables...");
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error("\n❌ Missing required environment variables:");
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error("\nPlease configure these in .env.local\n");
  process.exit(1);
}

console.log("✅ All environment variables present\n");

// Import and run the auto-resolve job
async function main() {
  try {
    // Dynamic import after env vars are loaded
    const { autoResolveExpiredContests } = require("../jobs/autoResolve");

    console.log("═══════════════════════════════════════════════════");
    console.log("     AUTO-RESOLVE JOB - LOCAL TEST RUN");
    console.log("═══════════════════════════════════════════════════\n");

    const result = await autoResolveExpiredContests();

    console.log("\n═══════════════════════════════════════════════════");
    console.log("              JOB COMPLETED");
    console.log("═══════════════════════════════════════════════════");
    console.log(`Resolved: ${result.resolved}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Total: ${result.total}`);
    console.log("═══════════════════════════════════════════════════\n");

    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ Fatal error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
