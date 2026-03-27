import * as pkg from "../models/index.js";
const { Prediction } = pkg.default;

import axios from "axios";

export const predict = async (req, res) => {
  try {
    const { title, body } = req.body;

    let imageUrl = null;

    // optional image
    if (req.file) {
      imageUrl = "temp-image-url";
    }

    // 🔥 CALL ML SERVER
    const mlResponse = await axios.post("http://localhost:8000/predict", {
      title,
      body: body || "",
      image_url: imageUrl
    });

    const { label, confidence, explanation } = mlResponse.data;

    // 💾 SAVE TO DB
    const saved = await Prediction.create({
      userId: req.user.id,
      title,
      body,
      imageUrl,
      label,
      confidence,
      explanation
    });

    // 📤 RETURN RESPONSE
    res.json({
      id: saved.id,
      label,
      confidence,
      explanation
    });

  } catch (err) {
    console.log("Predict error:", err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
};