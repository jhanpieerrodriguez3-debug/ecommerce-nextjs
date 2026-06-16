import { Router } from "express";
import axios from "axios";

const router = Router();
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:5000";

// ==========================================
// POST /api/users/login
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const response = await axios.post(
      `${USERS_SERVICE_URL}/auth/login`,
      req.body,
      { timeout: 5000 }
    );
    res.json(response.data);
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number; data: unknown }; message?: string };
    if (axiosErr.response) {
      res.status(axiosErr.response.status).json(axiosErr.response.data);
      return;
    }
    console.error("[BFF] users-service no disponible:", axiosErr.message);
    res.status(503).json({
      success: false,
      message: "Servicio de autenticación no disponible. Use las credenciales demo en el frontend."
    });
  }
});

// ==========================================
// POST /api/users/verify
// ==========================================
router.post("/verify", async (req, res) => {
  try {
    const response = await axios.post(
      `${USERS_SERVICE_URL}/auth/verify`,
      req.body,
      {
        headers: { Authorization: req.headers.authorization ?? "" },
        timeout: 3000
      }
    );
    res.json(response.data);
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status: number; data: unknown } };
    if (axiosErr.response) {
      res.status(axiosErr.response.status).json(axiosErr.response.data);
      return;
    }
    res.status(503).json({ valid: false, message: "Servicio no disponible" });
  }
});

// ==========================================
// GET /api/users/roles
// ==========================================
router.get("/roles", async (_req, res) => {
  try {
    const response = await axios.get(
      `${USERS_SERVICE_URL}/profiles/roles`,
      { timeout: 3000 }
    );
    res.json(response.data);
  } catch {
    res.json({
      success: true,
      source: "bff-fallback",
      roles: [
        { id: "client", label: "Cliente Vecino" },
        { id: "admin", label: "Dueño de Almacén" }
      ]
    });
  }
});

export default router;