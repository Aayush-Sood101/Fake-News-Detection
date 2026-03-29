import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import predictRoutes from "./routes/predict.route.js";
import historyRoutes from "./routes/history.js";

import db from "./models/index.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimit.js";
import { validateRegister, validateLogin, handleValidationErrors } from "./middleware/validators.js";
import { checkMLServiceHealth } from "./utils/pythonClient.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cookieParser());
app.use(morgan('combined')); // HTTP request logging
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const mlHealth = await checkMLServiceHealth();
    res.json({
      status: "ok",
      backend: "running",
      database: "connected",
      ml_service: mlHealth.status || "ok"
    });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      backend: "running",
      database: "connected",
      ml_service: "unavailable",
      error: err.message
    });
  }
});

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
app.use("/api/history", historyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
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
    console.log("✅ Database synced");

    // Check ML service
    try {
      const mlHealth = await checkMLServiceHealth();
      console.log("✅ ML service is healthy:", mlHealth);
    } catch (err) {
      console.warn("⚠️  ML service is unavailable:", err.message);
      console.warn("   Backend will start, but predictions will fail until ML service is running");
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
