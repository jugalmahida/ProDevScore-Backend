import { Router } from "express";
import {
  getAllUsers,
  loginUser,
  logoutUser,
  refreshTokens,
  registerAdmin,
  registerUser,
  updateUser,
} from "../controllers/user.controller.js";
import {
  authMiddleware,
  isAdmin,
  isAdminOrUser,
} from "../middleware/auth.middleware.js";

const router = Router();

// router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/refresh-tokens", refreshTokens);

router.use(authMiddleware);

router.post("/registerAdmin", isAdmin, registerAdmin);

router.put("/updateUser/:id", isAdminOrUser, updateUser);

router.post("/logoutUser", isAdminOrUser, logoutUser);

router.get("/", isAdmin, getAllUsers);

export default router;
