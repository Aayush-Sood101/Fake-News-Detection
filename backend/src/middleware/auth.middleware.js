import jwt from "jsonwebtoken";
import * as pkg from "../models/index.js";
const { User } = pkg.default;

export const Auth = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    console.log("Auth Header:", req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "No token"});
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized, Invalid Token" });
    }

    // ✅ Sequelize method
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();

  } catch (error) {
    console.log("Error in Protected Route middleware:", error.message);
    res.status(401).json({ message: "Unauthorized "});
  }
};