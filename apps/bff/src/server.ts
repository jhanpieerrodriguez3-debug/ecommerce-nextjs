import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRoutes from "./routes/users.routes";
import storesRoutes from "./routes/stores.routes";
import healthRoutes from "./routes/health.routes";

dotenv.config();

// ===========================================================================
// STARTUP VALIDATION — Verificar variables de entorno requeridas
// ===========================================================================
function validateEnvironment(): void {
  const required: string[] = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];

  if (process.env.NODE_ENV === "production") {
    required.push("FRONTEND_URL", "USERS_SERVICE_URL");
  }

  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error(
      `[BFF] ❌ Missing required environment variables:\n` +
        missing.map((k) => `   - ${k}`).join("\n") +
        `\n\nAdd them to .env.local (development) or Vercel dashboard (production).\n` +
        `Server startup aborted.`,
    );
    process.exit(1);
  }
}

validateEnvironment();

// ===========================================================================
// CORS — Orígenes permitidos
// En producción, se requiere FRONTEND_URL configurado explícitamente.
// En desarrollo se permiten los puertos locales.
// ===========================================================================
const allowedOrigins: string[] = [
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000"]
    : []),
  ...[process.env.FRONTEND_URL].filter((o): o is string => Boolean(o)),
];

const app = express();

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  }),
);
app.use(express.json());

// ===========================================================================
// RUTAS DEL BFF
// El BFF actúa como punto de entrada único para el frontend.
// Agrega, valida y transforma datos provenientes de múltiples servicios.
// ===========================================================================

// /health — Estado general del sistema
app.use("/health", healthRoutes);

// /api/users — Operaciones de autenticación y perfiles (delega a users-service)
app.use("/api/users", usersRoutes);

// /api/stores — Datos del catálogo de almacenes (delega a Supabase)
app.use("/api/stores", storesRoutes);

// Catch-all: ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada en el BFF de DIGITALMARKET",
  });
});

// ===========================================================================
// ARRANQUE
// ===========================================================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[BFF] ✅ Running on port ${PORT}`);
  console.log(`[BFF] Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `[BFF] Allowed CORS origins: ${allowedOrigins.join(", ") || "(none — CORS disabled)"}`,
  );
  console.log(
    `[BFF] Proxying users-service at ${process.env.USERS_SERVICE_URL || "http://localhost:5000"}`,
  );
});