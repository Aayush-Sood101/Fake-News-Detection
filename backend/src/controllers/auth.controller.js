import db from "../models/index.js";
const { User } = db;
import bcrypt from "bcryptjs";
import {generateToken} from "../lib/token.js"

export const signup=async(req,res)=>{
    const {email,password,name,role}=req.body;

    try{    
        if (!req.body) {
            return res.status(400).json({message: "Request body is required"});
        }
        if (!email || !password || !name || !role) {
            return res.status(400).json({message: "All fields are required"});
        }

        if (password.length < 8) {
            return res.status(400).json({message: "Password must be at least 8 characters"}); 
        }

        if (!/\d/.test(password)) {
            return res.status(400).json({message: "Password must contain at least one number"});
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({message: "User already exists with this email"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt); 

        const newUser = await User.create({
            email,
            password: hashPassword,
            name,
            role: role || "user"
        });

        generateToken(newUser.id, res);

        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
        });

    }
    catch(err){
        console.log("Error in the signup controller", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    
    generateToken(user.id, res);

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.log("Error in login controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0) // 🔥 expire immediately
    });

    res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    console.log("Error in logout:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};