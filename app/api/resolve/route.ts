import { NextResponse } from "next/server";
import { resolveWithAgent } from "@/services/resolverAgent";
import { getContestOracle } from "@/lib/contestOracleClient";

/**
 * Signed Resolution API
 * 
 * Main endpoint for autonomous contest resolution.
 * 
 * Flow:
 * 1. Fetch oracle data (external facts)
 * 2. AI agent analyzes and signs decision
 * 3. Submit signed resolution to smart contract
 * 4. Return result
 */

export async function POST(req: Request) {
  try {
    const { contestId, question, criteria } = await req.json();

    if (!contestId || !question) {
      return NextResponse.json(
        { error: "contestId and question are required" },
        { status: 400 }
      );
    }

    // Step 1: Fetch oracle data
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const oracleRes = await fetch(
      `${appUrl}/api/oracle/fetch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: criteria || question })
      }
    );

    if (!oracleRes.ok) {
      throw new Error("Failed to fetch oracle data");
    }

    const oracleData = await oracleRes.json();

    // Step 2: Agent decision + signature
    const { outcome, signature, reasoning, confidence } = await resolveWithAgent(
      contestId,
      question,
      criteria || question,
      oracleData
    );

    console.log("Resolution decision:", {
      contestId,
      outcome,
      reasoning,
      confidence
    });

    // Step 3: Submit to smart contract
    const contract = getContestOracle();
    
    const tx = await contract.resolveContest(
      contestId,
      outcome,
      signature
    );

    console.log("Transaction submitted:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log("Transaction confirmed:", receipt.hash);

    // Step 4: Return result
    return NextResponse.json({
      success: true,
      contestId,
      outcome,
      reasoning,
      confidence,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (error: any) {
    console.error("Resolution error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to resolve contest",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
