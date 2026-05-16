import { Router } from "express";
import { login } from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);

router.get(
  "/profile",
  verifyToken,
  (req, res) => {
    res.json({
      success: true,
      message: "Ruta protegida",
      user: (req as any).user
    });
  }
);

export default router;