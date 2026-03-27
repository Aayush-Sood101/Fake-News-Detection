import express from "express";
import { predict } from "../controllers/predict.js";
import {Auth} from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", Auth, upload.single("image"), predict);

export default router;