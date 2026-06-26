import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

// ---------------------------------------------------------------------------
// JWT_SECRET — leído exclusivamente de variable de entorno
// Si no está definida en producción, el servidor no debería haber arrancado
// (validación en server.ts). En desarrollo, se usa un valor por defecto
// solo para facilitar la ejecución local.
// ---------------------------------------------------------------------------
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[users-service] JWT_SECRET is required in production");
    }
    console.warn(
      "[users-service] WARNING: JWT_SECRET not set. Using insecure development default. " +
        "Set JWT_SECRET in .env.local for local development.",
    );
    return "digitalmarket_dev_only_secret_do_not_use_in_production";
  }
  return secret;
}

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
      message: "Email y contraseña son requeridos",
    });
  }

  // --- MOCK ACCOUNTS para demostración (solo en desarrollo) ---
  if (process.env.NODE_ENV !== "production") {
    const MOCK_ACCOUNTS: Record<
      string,
      { role: "admin" | "client"; full_name: string; store_id?: number }
    > = {
      "admin@test.com": {
        role: "admin",
        full_name: "Gonzalo Valenzuela (Don Tito)",
        store_id: 1,
      },
      "client@test.com": {
        role: "client",
        full_name: "Vecino Frecuente",
      },
    };

    if (password === "123456" && MOCK_ACCOUNTS[email]) {
      const mockUser = MOCK_ACCOUNTS[email];
      const token = jwt.sign(
        {
          sub: `mock-${email.replace("@", "-").replace(".", "-")}`,
          email,
          role: mockUser.role,
          full_name: mockUser.full_name,
          store_id: mockUser.store_id || null,
        },
        getJwtSecret(),
        { expiresIn: "8h" },
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
          store_id: mockUser.store_id || null,
        },
      });
    }
  }

  // --- PRODUCCIÓN: Delegar a Supabase ---
  // En producción, el frontend ya usa supabase.auth.signInWithPassword()
  // El users-service NO duplica esta lógica: Supabase Auth es la fuente de verdad
  return res.status(401).json({
    success: false,
    message:
      "Credenciales inválidas. Use Supabase Auth desde el frontend para autenticarse en producción.",
  });
});

// ==========================================
// POST /auth/verify
// Responsabilidad: Verificar validez de un JWT emitido por este servicio
// ==========================================
router.post("/verify", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ valid: false, message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return res.json({ valid: true, payload: decoded });
  } catch {
    return res
      .status(401)
      .json({ valid: false, message: "Token inválido o expirado" });
  }
});

export default router;