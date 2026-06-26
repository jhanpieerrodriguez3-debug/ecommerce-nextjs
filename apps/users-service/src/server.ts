import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";

dotenv.config();

// ===========================================================================
// STARTUP VALIDATION — Verificar variables de entorno requeridas
// El servidor NO debe arrancar en producción sin las variables críticas.
// ===========================================================================
function validateEnvironment(): void {
  const required: string[] = ["JWT_SECRET"];

  if (process.env.NODE_ENV === "production") {
    required.push("FRONTEND_URL", "BFF_URL");
  }

  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error(
      `[users-service] ❌ Missing required environment variables:\n` +
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
// En producción, FRONTEND_URL y BFF_URL son obligatorios (validados arriba).
// En desarrollo, se permiten los puertos locales de cada servicio.
// ===========================================================================
const allowedOrigins: string[] = [
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://localhost:4000"]
    : []),
  ...[process.env.FRONTEND_URL, process.env.BFF_URL].filter(
    (o): o is string => Boolean(o),
  ),
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
// RUTAS
// ===========================================================================
app.use("/auth", authRoutes);
app.use("/profiles", profileRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    service: "users-service",
    status: "healthy",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ===========================================================================
// ARRANQUE
// ===========================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[users-service] ✅ Running on port ${PORT}`);
  console.log(
    `[users-service] Environment: ${process.env.NODE_ENV || "development"}`,
  );
  console.log(
    `[users-service] Allowed CORS origins: ${allowedOrigins.join(", ") || "(none — CORS disabled)"}`,
  );
});
