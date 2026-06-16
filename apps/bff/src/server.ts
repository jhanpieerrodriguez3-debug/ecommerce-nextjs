import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRoutes from "./routes/users.routes";
import storesRoutes from "./routes/stores.routes";
import healthRoutes from "./routes/health.routes";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",   // Frontend Next.js local
    process.env.FRONTEND_URL || "*"  // URL de producción (Vercel env var)
  ],
  credentials: true
}));
app.use(express.json());

// ==========================================
// RUTAS DEL BFF
// El BFF actúa como punto de entrada único para el frontend.
// Agrega, valida y transforma datos provenientes de múltiples servicios.
// ==========================================

// /health — Estado general del sistema
app.use("/health", healthRoutes);

// /api/users — Operaciones de autenticación y perfiles (delega a users-service :5000)
app.use("/api/users", usersRoutes);

// /api/stores — Datos del catálogo de almacenes (delega a Supabase o mock)
app.use("/api/stores", storesRoutes);

// Catch-all: ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada en el BFF de DIGITALMARKET"
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[BFF] Running on http://localhost:${PORT}`);
  console.log(`[BFF] Proxying users-service at ${process.env.USERS_SERVICE_URL || "http://localhost:5000"}`);
});