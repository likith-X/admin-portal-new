import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("ai_resolution_suggestions")
    .select("*")
    .eq("contest_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json(data || null);
}
