import FormData from "form-data";
import pkg from "../models/index.js";
import { predict as mlPredict } from "../utils/pythonClient.js";
import { sanitizeArticle } from "../utils/sanitize.js";
const { Prediction } = pkg;

export const predict = async (req, res) => {
  try {
    const { title, body } = sanitizeArticle(req.body.title, req.body.body);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("body", body || "");

    if (req.file) {
      formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    }

    // Call ML service using pythonClient
    const mlResponse = await mlPredict(formData);
    const { label, confidence, explanation, modality } = mlResponse;

    // Save prediction to database
    const saved = await Prediction.create({
      userId: req.user.id,
      title,
      body: body || "",
      imageUrl: null,
      label,
      confidence,
      explanation,
      modality: modality || 'text_only'
    });

    res.json({
      id: saved.id,
      label,
      confidence,
      explanation,
      modality
    });

  } catch (err) {
    console.log("Predict error:", err.message);
    res.status(500).json({ error: err.message || "Prediction failed" });
  }
};

export const getPredictionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prediction = await Prediction.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });

    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    res.json(prediction);

  } catch (err) {
    console.log("Get prediction error:", err.message);
    res.status(500).json({ error: "Failed to retrieve prediction" });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    // Find prediction
    const prediction = await Prediction.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });

    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    // Update feedback
    prediction.feedback = feedback;
    await prediction.save();

    res.json({
      message: "Feedback submitted successfully",
      prediction: {
        id: prediction.id,
        feedback: prediction.feedback
      }
    });

  } catch (err) {
    console.log("Submit feedback error:", err.message);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
};