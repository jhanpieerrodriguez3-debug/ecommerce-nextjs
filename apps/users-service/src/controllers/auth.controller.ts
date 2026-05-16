import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const SECRET = "digitalmarket_secret";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (
    email === "admin@test.com" &&
    password === "123456"
  ) {
    const token = jwt.sign(
      {
        email,
        role: "admin"
      },
      SECRET,
      {
        expiresIn: "1h"
      }
    );

    return res.json({
      success: true,
      token
    });
  }

  return res.status(401).json({
    success: false,
    message: "Credenciales inválidas"
  });
};