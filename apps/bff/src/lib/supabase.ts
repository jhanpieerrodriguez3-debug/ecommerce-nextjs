import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kygfupvjcewxxihbnuqf.supabase.co";

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Z2Z1cHZqY2V3eHhpaGJudXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTE0ODksImV4cCI6MjA5NTkyNzQ4OX0.f64JLs6QPKkMEk62TVbhnAW1cGwcrIbbMDKY_FJ_lNA";

export const supabase = createClient(supabaseUrl, supabaseKey);
