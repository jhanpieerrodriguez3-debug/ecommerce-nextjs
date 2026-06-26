import { Router } from "express";
import axios from "axios";

const router = Router();

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:5000";

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verifica el estado general del sistema.
 *     description: Comprueba el estado del BFF y la disponibilidad de los servicios conectados.
 *     responses:
 *       200:
 *         description: Estado del sistema obtenido correctamente.
 *         content:
 *           application/json:
 *             example:
 *               bff:
 *                 status: healthy
 *                 port: 4000
 *                 timestamp: "2026-06-26T02:45:00.000Z"
 *               services:
 *                 users-service:
 *                   status: healthy
 *                   url: http://localhost:5000
 *                 supabase:
 *                   status: external
 *                   note: Verificar en Supabase Dashboard
 *                 web (Next.js):
 *                   status: independent
 *                   note: Frontend se ejecuta en :3000
 *               architecture: monorepo-hybrid
 *               environment: development
 */

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