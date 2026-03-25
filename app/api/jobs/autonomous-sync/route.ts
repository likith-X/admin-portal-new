import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Autonomous Market Sync Job
 * 
 * 1. Fetches new suggestions from AI (News, Crypto, Tech)
 * 2. Automatically approves and creates on-chain contests for them
 */
export async function POST(req: Request) {
  try {
    // Basic Security Check (Optional: use a CRON_SECRET)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🤖 Starting Autonomous Market Sync...");

    // --- STEP 1: FETCH NEW SUGGESTIONS ---
    // We call the existing fetch logic (we can't easily import from the route, 
    // but we can trigger it via a local fetch or refactor it into a shared util).
    // For now, we'll trigger the existing endpoint for simplicity.
    
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    console.log("📡 Fetching new suggestions...");
    const fetchResponse = await fetch(`${baseUrl}/api/suggestions/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const fetchData = await fetchResponse.json();
    console.log(`✅ Fetch result: ${fetchData.count} suggestions added.`);

    // --- STEP 2: APPROVE ALL PENDING SUGGESTIONS ---
    console.log("🎯 Approving all pending suggestions...");
    const approveResponse = await fetch(`${baseUrl}/api/suggestions/approve-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const approveData = await approveResponse.json();
    console.log(`✅ Approval result: ${approveData.count} contests created.`);

    return NextResponse.json({
      success: true,
      summary: {
        suggestionsFetched: fetchData.count || 0,
        contestsCreated: approveData.count || 0
      },
      fetchDetails: fetchData,
      approveDetails: approveData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Autonomous sync failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Enable GET for testing/manual trigger
 */
export async function GET(req: Request) {
    return POST(req);
}
