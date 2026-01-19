// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This client MUST be used only on the server (never in browser)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);