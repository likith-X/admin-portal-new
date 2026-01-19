import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("contests")
    .select("*")
    .order("deadline", { ascending: true }); // Sort by deadline (soonest first)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, deadline, status = "OPEN" } = body;

    if (!question || !deadline) {
      return NextResponse.json(
        { error: "Question and deadline are required" },
        { status: 400 }
      );
    }

    // Create contest in database
    const { data, error } = await supabaseAdmin
      .from("contests")
      .insert({
        question,
        deadline,
        status,
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

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create contest" },
      { status: 500 }
    );
  }
}
