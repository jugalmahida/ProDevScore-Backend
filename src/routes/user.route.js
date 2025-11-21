import { Router } from "express";
import {
  getAllUsers,
  loginUser,
  logoutUser,
  changeUserPassword,
  refreshTokens,
  registerAdmin,
  registerUser,
  updateUser,
  verifyCodeAndSetTokens,
  deleteUser,
  verifyForgetPasswordTokenAndResetPassword,
  forgetPassword,
  getCurrentUser,
  loginWithGithub,
  loginWithGithubCallBack,
} from "../controllers/user.controller.js";

import {
  getCurrentUserSubscriptions,
  getUserSubscriptions,
} from "../controllers/usersubscriptions.controller.js";

import {
  authMiddleware,
  isAdmin,
  isAdminOrUser,
} from "../middleware/auth.middleware.js";

const router = Router();

// Open Routes

router.post("/register", registerUser);

router.post("/verifyCode", verifyCodeAndSetTokens);

router.get("/github", loginWithGithub);

router.post("/github/callback", loginWithGithubCallBack);

router.post("/login", loginUser);

router.post("/refresh-tokens", refreshTokens);

router.post("/forget-password", forgetPassword);

router.post("/verifyToken/:token", verifyForgetPasswordTokenAndResetPassword);

// Authorization Routes

// router.use(authMiddleware); <- remove and apply in each route because is going to apply all route even in verifyToken/:token since its above the this line

router.get("/me", authMiddleware, isAdminOrUser, getCurrentUser);

router.put("/profile/:id", authMiddleware, isAdminOrUser, updateUser);

router.patch(
  "/change-password",
  authMiddleware,
  isAdminOrUser,
  changeUserPassword
);

router.get(
  "/subscription",
  authMiddleware,
  isAdminOrUser,
  getCurrentUserSubscriptions
);

router.post("/logout", authMiddleware, isAdminOrUser, logoutUser);

// Admin Only Routes

router.post("/admin/register", authMiddleware, isAdmin, registerAdmin);

router.get("/admin/all", authMiddleware, isAdmin, getAllUsers);

router.get(
  "/admin/subscriptions/:userId",
  authMiddleware,
  isAdmin,
  getUserSubscriptions
);

router.delete("/admin/:id", authMiddleware, isAdmin, deleteUser);

export default router;
