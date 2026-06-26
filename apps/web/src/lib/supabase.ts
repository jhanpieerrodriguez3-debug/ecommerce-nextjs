import { createClient } from "@supabase/supabase-js";

// IMPORTANTE: La URL debe ser SOLO el dominio base, sin /rest/v1/ ni ningún path adicional.
// Correcto:   https://kygfupvjcewxxihbnuqf.supabase.co
// Incorrecto: https://kygfupvjcewxxihbnuqf.supabase.co/rest/v1/
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kygfupvjcewxxihbnuqf.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Z2Z1cHZqY2V3eHhpaGJudXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTE0ODksImV4cCI6MjA5NTkyNzQ4OX0.f64JLs6QPKkMEk62TVbhnAW1cGwcrIbbMDKY_FJ_lNA";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});