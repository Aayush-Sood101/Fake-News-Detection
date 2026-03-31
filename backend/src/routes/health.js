import express from "express";
import db from "../models/index.js";
import { checkMLServiceHealth } from "../utils/pythonClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      mlService: "unknown",
    },
  };

  try {
    await db.sequelize.authenticate();
    health.services.database = "healthy";
  } catch {
    health.services.database = "unhealthy";
    health.status = "degraded";
  }

  try {
    const mlHealth = await checkMLServiceHealth();
    health.services.mlService = mlHealth.status === "ok" ? "healthy" : "unhealthy";
  } catch {
    health.services.mlService = "unhealthy";
    health.status = "degraded";
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

router.get("/ready", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    await checkMLServiceHealth();
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

router.get("/live", (req, res) => {
  res.json({ alive: true });
});

export default router;
