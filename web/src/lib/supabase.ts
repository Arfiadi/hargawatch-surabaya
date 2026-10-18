import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ylzcvgmkaciawvfhbxvn.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable__NAaRZ3qvMwmLkxDmfpA5w_XALKhEee";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

