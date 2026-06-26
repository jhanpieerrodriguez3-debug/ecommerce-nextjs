/**
 * supabase.ts — Cliente Supabase para apps/bff (Node.js / Express)
 *
 * Usa únicamente variables de entorno sin prefijo NEXT_PUBLIC_.
 * El prefijo NEXT_PUBLIC_ no tiene significado en Node.js y no debe usarse
 * en servicios de backend.
 *
 * Credenciales:
 *   - SUPABASE_URL       → URL del proyecto Supabase
 *   - SUPABASE_ANON_KEY  → Clave anon para operaciones bajo RLS
 *
 * Si en el futuro se requiere bypass de RLS, usar SUPABASE_SERVICE_ROLE_KEY
 * (nunca exponer esta clave al frontend).
 */
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[BFF] Missing required environment variable: "${name}"\n` +
        `  → In development: add it to apps/bff/.env.local\n` +
        `  → In production:  add it to your Vercel project settings`,
    );
  }
  return value.trim();
}

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseKey = requireEnv("SUPABASE_ANON_KEY");

export const supabase = createClient(supabaseUrl, supabaseKey);
