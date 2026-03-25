import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getContestOracle } from "@/lib/contestOracleClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, deadline } = body;

    if (!question || !deadline) {
      return NextResponse.json(
        { error: "Question and deadline are required" },
        { status: 400 }
      );
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: "Deadline must be in the future" },
        { status: 400 }
      );
    }

    // Convert deadline to Unix timestamp
    const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

    // Create contest on blockchain
    const oracle = getContestOracle();
    const tx = await oracle.createContest(
      question,
      deadlineTimestamp,
      1 // ADMIN_ORACLE = 1
    );

    const receipt = await tx.wait();
    
    // Parse the ContestCreated event to get the contest ID
    const event = receipt.logs
      .map((log: any) => {
        try {
          return oracle.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "ContestCreated");

    if (!event) {
      throw new Error("ContestCreated event not found");
    }

    const contestIdOnchain = Number(event.args.contestId);

    // Store in database
    const { data, error } = await supabaseAdmin
      .from("contests")
      .insert({
        question,
        deadline: deadlineDate.toISOString(),
        status: "OPEN",
        contest_id_onchain: contestIdOnchain,
        resolution_type: "ADMIN_ORACLE",
        tx_hash: receipt.hash,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contest: data,
      transactionHash: receipt.hash,
    });
  } catch (error: any) {
    console.error("Error creating manual contest:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create contest" },
      { status: 500 }
    );
  }
}
