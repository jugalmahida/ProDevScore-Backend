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

// router.use(authMiddleware, isAdmin);

router.post("/", createPricingPlan);

router.get("/:id", getPricingPlanById);

router.put("/:id", updatePricingPlan);

router.delete("/:id", deletePricingPlan);

export default router;
