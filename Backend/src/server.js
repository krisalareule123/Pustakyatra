import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import readerRoutes from "./routes/reader.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Pustakyatra Backend Running ✅");
});

app.use("/api/readers", readerRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
