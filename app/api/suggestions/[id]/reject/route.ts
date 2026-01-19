// app/api/suggestions/[id]/reject/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    console.log(`🗑️ Rejecting suggestion: ${id}`);

    const { error } = await supabaseAdmin
      .from("suggested_contents")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting suggestion:", error);
      return NextResponse.json(
        { error: error.message || "Failed to reject suggestion" }, 
        { status: 500 }
      );
    }

    console.log(`✅ Successfully rejected suggestion ${id}`);

    return NextResponse.json({ 
      success: true,
      message: "Suggestion rejected successfully" 
    });
  } catch (error: any) {
    console.error("❌ Reject suggestion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject suggestion" },
      { status: 500 }
    );
  }
}
