import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Ambil dari variabel lingkungan jika ada (Vercel Prod/Preview), atau gunakan fallback client-side publishable key
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ylzcvgmkaciawvfhbxvn.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable__NAaRZ3qvMwmLkxDmfpA5w_XALKhEee";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
