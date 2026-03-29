import express from "express";
import { getHistory, getStats } from "../controllers/history.js";
import { Auth } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/history - Get user's prediction history with pagination
router.get("/", Auth, getHistory);

// GET /api/history/stats - Get user's statistics
router.get("/stats", Auth, getStats);

export default router;