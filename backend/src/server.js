import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.route.js";
import predictRoutes from "./routes/predict.route.js";
import historyRoutes from "./routes/history.js";

import db from "./models/index.js"; 

import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

dotenv.config();


app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/history", historyRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

const PORT = process.env.PORT || 5000;

// 👇 Sync DB first, then start server
await db.sequelize.sync({ force: false });
console.log("✅ Database synced");

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
