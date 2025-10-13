import { Router } from "express";
import {
  getAllUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "../controllers/user.controller.js";

const router = Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/updateUser", updateUser);

router.post("/logoutUser", logoutUser);

router.get("/", getAllUsers);

export default router;
