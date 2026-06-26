import { Router, Request, Response } from "express";

const router = Router();

// ==========================================
// GET /profiles/me
// Responsabilidad: Devolver datos del perfil a partir del token JWT
// El BFF llama a este endpoint para obtener el perfil del usuario
// ==========================================
router.get("/me", (req: Request, res: Response) => {
  // El perfil viene inyectado por el middleware de auth del BFF
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ success: false, message: "No autenticado" });
  }

  return res.json({
    success: true,
    profile: {
      id: user.sub,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      store_id: user.store_id || null
    }
  });
});

// ==========================================
// GET /profiles/roles
// Responsabilidad: Informar los roles disponibles en el sistema
// Útil para el frontend al momento de registro
// ==========================================
router.get("/roles", (_req: Request, res: Response) => {
  res.json({
    success: true,
    roles: [
      {
        id: "client",
        label: "Cliente Vecino",
        description: "Puede explorar almacenes y realizar pedidos online"
      },
      {
        id: "admin",
        label: "Dueño de Almacén",
        description: "Gestiona inventario, ventas y caja registradora de su tienda"
      }
    ]
  });
});

export default router;
