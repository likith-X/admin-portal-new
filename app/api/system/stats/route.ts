import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data: nodes, error } = await supabaseAdmin
      .from("node_health")
      .select("*")
      .in("node_name", ["SENTIMENT_AGENT", "AMM_AGENT", "ORACLE_RESOLVER"]);

    if (error) throw error;

    return NextResponse.json(nodes || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
