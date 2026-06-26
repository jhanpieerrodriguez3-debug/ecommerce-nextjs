import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT_SECRET — leído exclusivamente de variable de entorno
// La validación de startup en server.ts garantiza que esta variable
// existe antes de que cualquier request sea procesado.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[users-service] JWT_SECRET is required in production");
    }
    return "digitalmarket_dev_only_secret_do_not_use_in_production";
  }
  return secret;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Token requerido",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    (req as Request & { user: unknown }).user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
};