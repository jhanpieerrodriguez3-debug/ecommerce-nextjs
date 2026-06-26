/**
 * supabase.ts — Cliente Supabase para apps/web (browser)
 *
 * Usa exclusivamente variables NEXT_PUBLIC_* validadas en env.ts.
 * NO contiene URLs, keys ni secrets hardcodeados.
 *
 * Credenciales:
 *   - NEXT_PUBLIC_SUPABASE_URL     → URL pública del proyecto Supabase
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY → Clave anon (segura para el cliente)
 *
 * La service_role key NUNCA debe usarse en el frontend.
 */
import { createClient } from "@supabase/supabase-js";
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from "./env";

export const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);