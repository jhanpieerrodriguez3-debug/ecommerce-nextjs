/**
 * @deprecated auth.controller.ts
 *
 * ESTE ARCHIVO ES CÓDIGO LEGACY Y NO ESTÁ SIENDO UTILIZADO.
 *
 * El handler de login activo se encuentra en:
 *   apps/users-service/src/routes/auth.routes.ts
 *
 * Razones por las que este archivo fue marcado como deprecated:
 *   1. Usaba un JWT secret hardcodeado ("digitalmarket_secret") no leído de process.env
 *   2. La lógica de login está duplicada con auth.routes.ts
 *   3. No es importado por ningún router activo
 *
 * TODO: Eliminar este archivo en la siguiente limpieza de código legacy.
 *       Verificar con `grep -r "auth.controller"` que no sea importado antes de borrar.
 */

import { Request, Response } from "express";
import jwt from "jsonwebtoken";

// ⚠️ DEPRECATED — No usar. Ver auth.routes.ts
export const login = async (req: Request, res: Response) => {
  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) {
    return res.status(500).json({
      success: false,
      message:
        "Server misconfiguration: JWT_SECRET not set. This endpoint is deprecated — use /auth/login in auth.routes.ts.",
    });
  }

  const { email, password } = req.body;

  if (email === "admin@test.com" && password === "123456") {
    const token = jwt.sign({ email, role: "admin" }, SECRET, {
      expiresIn: "1h",
    });
    return res.json({ success: true, token });
  }

  return res.status(401).json({
    success: false,
    message: "Credenciales inválidas",
  });
};