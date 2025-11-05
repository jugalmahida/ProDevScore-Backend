import express from "express";
import {
  createPricingPlan,
  deletePricingPlan,
  getAllPricingPlans,
  getPricingPlanById,
  updatePricingPlan,
} from "../controllers/pricingplan.controller.js";

import { authMiddleware, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllPricingPlans);

router.post("/", authMiddleware, isAdmin, createPricingPlan);

router.get("/:id", authMiddleware, isAdmin, getPricingPlanById);

router.put("/:id", authMiddleware, isAdmin, updatePricingPlan);

router.delete("/:id", authMiddleware, isAdmin, deletePricingPlan);

export default router;
