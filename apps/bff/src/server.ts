import express from "express";
import cors from "cors";
import usersRoutes from "./routes/users.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/users", usersRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "BFF funcionando correctamente"
  });
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`BFF running on port ${PORT}`);
});