import express from "express";
import {
  generateAnalysisScore,
  generateGridCommitsData,
  getContributorsData,
} from "../controllers/analysisreport.controller.js";

const router = express.Router();

router.post("/getContributors", getContributorsData);
router.post("/analysis", generateAnalysisScore);
router.post("/gridcommits", generateGridCommitsData);

export default router;
