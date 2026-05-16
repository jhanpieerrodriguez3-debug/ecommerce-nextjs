import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:5000");

    res.json({
      fromBFF: true,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      error: "Error conectando con Users Service"
    });
  }
});

export default router;