import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[users-service] Running on http://localhost:${PORT}`);
  console.log(`[users-service] Health check: http://localhost:${PORT}/health`);
});