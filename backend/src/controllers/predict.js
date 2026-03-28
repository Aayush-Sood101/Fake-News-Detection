import FormData from "form-data";
import axios from "axios";
import pkg from "../models/index.js";
const  {Prediction}  = pkg;

export const predict = async (req, res) => {
  try {
    const { title, body } = req.body;

    const formData = new FormData();

    formData.append("title", title);
    formData.append("body", body || "");

    
    if (req.file) {
      formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    }

    
    const mlResponse = await axios.post(
      "http://localhost:8000/predict",
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    const { label, confidence, explanation } = mlResponse.data;

    const saved = await Prediction.create({
      userId: req.user.id,
      title,
      body,
      imageUrl: null,
      label,
      confidence,
      explanation
    });

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