import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Pustakyatra Backend is running ✅");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
