/**
 * env.ts — Validación de variables de entorno para apps/web
 *
 * Todas las variables NEXT_PUBLIC_* son sustituidas estáticamente por Next.js
 * en tiempo de build. Este módulo centraliza su validación y exporta valores
 * tipados y garantizados (no undefined).
 *
 * Si una variable requerida no está definida, se lanza un error descriptivo
 * que se muestra en consola tanto en build como en runtime.
 */

/**
 * Valida que una variable de entorno exista y sea non-empty.
 * IMPORTANTE: el parámetro `value` debe ser `process.env.NOMBRE_LITERAL`
 * para que Next.js pueda hacer static replacement en el bundle del cliente.
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `[DigitalMarket] Missing required environment variable: "${name}"\n` +
        `  → In development: add it to apps/web/.env.local\n` +
        `  → In production:  add it to your Vercel project settings`,
    );
  }
  return value.trim();
}

// ---------------------------------------------------------------------------
// Supabase — accesibles desde el browser (prefijo NEXT_PUBLIC_)
// ---------------------------------------------------------------------------
export const NEXT_PUBLIC_SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const NEXT_PUBLIC_SUPABASE_ANON_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// ---------------------------------------------------------------------------
// BFF — URL del Backend-for-Frontend (accesible desde el browser)
// ---------------------------------------------------------------------------
export const NEXT_PUBLIC_BFF_URL = requireEnv(
  "NEXT_PUBLIC_BFF_URL",
  process.env.NEXT_PUBLIC_BFF_URL,
);

// ---------------------------------------------------------------------------
// Exportación agrupada conveniente
// ---------------------------------------------------------------------------
export const env = {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_BFF_URL,
} as const;

export default env;
