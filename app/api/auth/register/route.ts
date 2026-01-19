import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password required" },
        { status: 400 }
      );
    }

    // Create Supabase auth user with email verification
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Requires email verification
      user_metadata: { username }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Store additional user info
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        username,
        email,
        email_verified: false
      })
      .select()
      .single();

    if (error) {
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Registration successful! Please check your email to verify your account.",
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        email_verified: false
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
