// app/api/suggestions/[id]/reject/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("suggested_contents")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    console.error("Error rejecting suggestion:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/suggestions", _req.url));
}
