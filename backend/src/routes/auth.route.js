import express from "express"
import {signup,login,logout} from '../controllers/auth.controller.js'
import { validateRegister, validateLogin, handleValidationErrors } from "../middleware/validators.js";

const router=express.Router();

router.post("/signup", validateRegister, handleValidationErrors, signup)

router.post("/login", validateLogin, handleValidationErrors, login);

router.post("/logout",logout);

export default router;
