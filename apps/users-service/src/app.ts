import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:4000",
    process.env.FRONTEND_URL || "*",
    process.env.BFF_URL || "*"
  ],
  credentials: true
}));

app.use(express.json());

// Rutas
app.use("/auth", authRoutes);
app.use("/profiles", profileRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.json({
    service: "users-service",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

export default app;