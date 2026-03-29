import express from "express";
import { predict, getPredictionById, submitFeedback } from "../controllers/predict.js";
import { Auth } from "../middleware/auth.middleware.js";
import { validatePredict, validateFeedback, handleValidationErrors } from "../middleware/validators.js";
import { predictLimiter } from "../middleware/rateLimit.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// POST /api/predict - Make a prediction
router.post(
  "/",
  Auth,
  predictLimiter,
  upload.single("image"),
  validatePredict,
  handleValidationErrors,
  predict
);

// GET /api/predict/:id - Get specific prediction
router.get("/:id", Auth, getPredictionById);

// POST /api/predict/:id/feedback - Submit feedback
router.post(
  "/:id/feedback",
  Auth,
  validateFeedback,
  handleValidationErrors,
  submitFeedback
);

export default router;