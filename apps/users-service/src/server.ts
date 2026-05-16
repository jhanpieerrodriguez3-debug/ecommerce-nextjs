import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    service: "Users Service funcionando"
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Users Service running on port ${PORT}`);
});
