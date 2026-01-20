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
    const queryForOracle = criteria || question;
    
    // Parse and validate timeout from environment variable
    const timeoutMs = (() => {
      const envTimeout = parseInt(process.env.ORACLE_TIMEOUT_MS || "", 10);
      return !isNaN(envTimeout) && envTimeout > 0 ? envTimeout : 5000;
    })();
    
    // Create AbortController with configurable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    let oracleRes;
    try {
      oracleRes = await fetch(
        `${appUrl}/api/oracle/fetch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryForOracle }),
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId); // Clear timeout on successful fetch
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Oracle fetch timed out after 5s for query: "${queryForOracle.substring(0, 100)}..."`);
      }
      throw new Error(`Oracle fetch failed for query "${queryForOracle.substring(0, 100)}...": ${fetchError.message}`);
    }

    if (!oracleRes.ok) {
      let errorBody = "";
      try {
        const contentType = oracleRes.headers.get("content-type");
        const isTextContent = contentType?.includes("application/json") || 
                              contentType?.includes("text/") ||
                              contentType?.includes("application/xml");
        
        if (!isTextContent) {
          errorBody = `(binary/non-text content-type: ${contentType})`;
        } else if (contentType?.includes("application/json")) {
          const errorJson = await oracleRes.json();
          errorBody = JSON.stringify(errorJson);
        } else {
          errorBody = await oracleRes.text();
        }
        
        // Truncate to safe maximum length
        const MAX_ERROR_LENGTH = 500;
        if (errorBody.length > MAX_ERROR_LENGTH) {
          errorBody = errorBody.substring(0, MAX_ERROR_LENGTH) + "...[truncated]";
        }
      } catch {
        errorBody = "(failed to read response body)";
      }
      throw new Error(
        `Oracle fetch failed: ${oracleRes.status} ${oracleRes.statusText}. Response: ${errorBody}. Query: "${queryForOracle.substring(0, 100)}..."`
      );
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
