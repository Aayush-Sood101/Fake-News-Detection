import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import predictRoutes from "./routes/predict.route.js";
import historyRoutes from "./routes/history.js";
import healthRoutes from "./routes/health.js";

import db from "./models/index.js";
import {
  helmetConfig,
  globalLimiter,
  authLimiter,
  sanitize,
  xssClean,
  preventParamPollution,
} from "./middleware/security.js";
import { checkMLServiceHealth } from "./utils/pythonClient.js";
import corsOptions from "./config/cors.js";
import requestLogger from "./middleware/requestLogger.js";
import logger from "./utils/logger.js";
import { cacheMiddleware } from "./middleware/cache.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cookieParser());
app.use(morgan('combined')); // HTTP request logging
app.use(requestLogger);
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitize);
app.use(xssClean);
app.use(preventParamPollution);

// Apply rate limiting
app.use('/api', globalLimiter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Fake News Detection Backend",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      predict: "/api/predict",
      history: "/api/history"
    }
  });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/history", cacheMiddleware(120), historyRoutes);
app.use("/api/health", healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  
  // Multer file upload errors
  if (err.message && err.message.includes('file type')) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Sync database
    await db.sequelize.sync({ force: false });
    logger.info("Database synced");

    // Check ML service
    try {
      const mlHealth = await checkMLServiceHealth();
      logger.info("ML service is healthy", mlHealth);
    } catch (err) {
      logger.warn("ML service is unavailable", { error: err.message });
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });

  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, startServer };
export default app;
