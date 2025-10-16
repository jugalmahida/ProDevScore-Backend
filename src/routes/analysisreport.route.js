import express from "express";
import {
  generateAnalysisScore,
  generateGridCommitsData,
  getContributorsData,
} from "../controllers/analysisreport.controller.js";

import {
  authMiddleware,
  isAdmin,
  isAdminOrUser,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/getContributors", isAdminOrUser, getContributorsData);
router.post("/analysis", isAdminOrUser, generateAnalysisScore);
router.post("/gridcommits", isAdminOrUser, generateGridCommitsData);

export default router;
