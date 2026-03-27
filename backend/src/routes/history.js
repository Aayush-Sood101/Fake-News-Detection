import express from "express";
import { getHistory } from "../controllers/history.js";
import { Auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", Auth, getHistory);

export default router;