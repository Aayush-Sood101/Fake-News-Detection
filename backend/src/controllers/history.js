import pkg from "../models/index.js";
const { Prediction } = pkg;

export const getHistory = async (req, res) => {
  try {
    const data = await Prediction.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]]
    });

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};