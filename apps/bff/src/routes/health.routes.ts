import { Router } from "express";
import axios from "axios";

const router = Router();

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:5000";

// ==========================================
// GET /health
// ==========================================
router.get("/", async (_req, res) => {
  const checks = await Promise.allSettled([
    axios.get(`${USERS_SERVICE_URL}/health`, { timeout: 2000 })
  ]);

  const usersServiceStatus =
    checks[0].status === "fulfilled" ? "healthy" : "unavailable";

  res.json({
    bff: {
      status: "healthy",
      port: process.env.PORT || 4000,
      timestamp: new Date().toISOString()
    },
    services: {
      "users-service": {
        status: usersServiceStatus,
        url: USERS_SERVICE_URL
      },
      supabase: {
        status: "external",
        note: "Verificar en Supabase Dashboard"
      },
      "web (Next.js)": {
        status: "independent",
        note: "Frontend se ejecuta en :3000"
      }
    },
    architecture: "monorepo-hybrid",
    environment: process.env.NODE_ENV || "development"
  });
});

export default router;
