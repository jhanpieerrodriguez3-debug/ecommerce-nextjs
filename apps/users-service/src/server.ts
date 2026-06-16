import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",   // Frontend Next.js local
    "http://localhost:4000",   // BFF local
    process.env.FRONTEND_URL || "*",  // URL web en producción (Vercel env var)
    process.env.BFF_URL || "*"        // URL BFF en producción (Vercel env var)
  ],
  credentials: true
}));
app.use(express.json());

// Rutas de autenticación y perfiles
app.use("/auth", authRoutes);
app.use("/profiles", profileRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    service: "users-service",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[users-service] Running on http://localhost:${PORT}`);
  console.log(`[users-service] Health check: http://localhost:${PORT}/health`);
});
