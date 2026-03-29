import pkg from "../models/index.js";
import { Op } from "sequelize";
import db from "../models/index.js";
const { Prediction } = pkg;

export const getHistory = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Filtering parameters
    const { label, startDate, endDate } = req.query;
    
    const where = { userId: req.user.id };

    // Filter by label
    if (label && (label === 'REAL' || label === 'FAKE')) {
      where.label = label;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // Get predictions with pagination
    const { count, rows } = await Prediction.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset
    });

    res.json({
      predictions: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (err) {
    console.log("Get history error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get aggregate statistics
    const stats = await Prediction.findAll({
      where: { userId },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
        [db.sequelize.fn('AVG', db.sequelize.col('confidence')), 'avgConfidence'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN label = 'FAKE' THEN 1 END")), 'totalFake'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN label = 'REAL' THEN 1 END")), 'totalReal'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN modality = 'multimodal' THEN 1 END")), 'totalMultimodal'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN modality = 'text_only' THEN 1 END")), 'totalTextOnly'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN feedback = 'correct' THEN 1 END")), 'feedbackCorrect'],
        [db.sequelize.fn('COUNT', db.sequelize.literal("CASE WHEN feedback = 'incorrect' THEN 1 END")), 'feedbackIncorrect']
      ],
      raw: true
    });

    const result = stats[0];

    res.json({
      total: parseInt(result.total) || 0,
      avgConfidence: parseFloat(result.avgConfidence) || 0,
      breakdown: {
        fake: parseInt(result.totalFake) || 0,
        real: parseInt(result.totalReal) || 0
      },
      modality: {
        multimodal: parseInt(result.totalMultimodal) || 0,
        textOnly: parseInt(result.totalTextOnly) || 0
      },
      feedback: {
        correct: parseInt(result.feedbackCorrect) || 0,
        incorrect: parseInt(result.feedbackIncorrect) || 0,
        pending: parseInt(result.total) - parseInt(result.feedbackCorrect) - parseInt(result.feedbackIncorrect)
      }
    });

  } catch (err) {
    console.log("Get stats error:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};