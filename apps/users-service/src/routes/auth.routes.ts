import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "digitalmarket_secret_dev";

// ==========================================
// POST /auth/login
// Responsabilidad: Validar credenciales y emitir JWT
// Soporta: credenciales mock (demo) + forward a Supabase (producción)
// ==========================================
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email y contraseña son requeridos"
    });
  }

  // --- MOCK ACCOUNTS para demostración académica ---
  const MOCK_ACCOUNTS: Record<string, { role: "admin" | "client"; full_name: string; store_id?: number }> = {
    "admin@test.com": {
      role: "admin",
      full_name: "Gonzalo Valenzuela (Don Tito)",
      store_id: 1
    },
    "client@test.com": {
      role: "client",
      full_name: "Vecino Frecuente"
    }
  };

  if (password === "123456" && MOCK_ACCOUNTS[email]) {
    const mockUser = MOCK_ACCOUNTS[email];
    const token = jwt.sign(
      {
        sub: `mock-${email.replace("@", "-").replace(".", "-")}`,
        email,
        role: mockUser.role,
        full_name: mockUser.full_name,
        store_id: mockUser.store_id || null
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      source: "mock",
      token,
      profile: {
        id: `mock-${email.replace("@", "-").replace(".", "-")}`,
        email,
        role: mockUser.role,
        full_name: mockUser.full_name,
        store_id: mockUser.store_id || null
      }
    });
  }

  // --- PRODUCCIÓN: Delegar a Supabase ---
  // En producción, el frontend ya usa supabase.auth.signInWithPassword()
  // El users-service NO duplica esta lógica: Supabase Auth es la fuente de verdad
  return res.status(401).json({
    success: false,
    message: "Credenciales inválidas. Use las cuentas de demostración o inicie sesión desde el frontend con Supabase."
  });
});

// ==========================================
// POST /auth/verify
// Responsabilidad: Verificar validez de un JWT emitido por este servicio
// ==========================================
router.post("/verify", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false, message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, payload: decoded });
  } catch {
    return res.status(401).json({ valid: false, message: "Token inválido o expirado" });
  }
});

export default router;