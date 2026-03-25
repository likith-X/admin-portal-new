import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const is_test = searchParams.get("is_test");
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("contests")
    .select("*")
    .order("deadline", { ascending: true });

  if (is_test === "true") {
    query = query.eq("is_test", true);
  } else if (is_test === "false") {
    query = query.eq("is_test", false);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Wrap in object for consistent parsing if needed, but the current frontend expects data directly in some places
  // and data.contests in others. Let's fix the frontend to be consistent with the array result.
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
