import { PricingPlan } from "../models/pricingplan.model.js"; // Adjust path as needed
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { AppSuccess } from "../utils/AppSuccess.js";

// Create a new Pricing Plan
export const createPricingPlan = asyncHandler(async (req, res, next) => {
  const { name, price, description, features, tier, isPopular, limits } =
    req.body;

  if (!name || !price || !description || !features || !tier || !limits) {
    return next(AppError.badRequest("Required fields are missing"));
  }

  const existingPlan = await PricingPlan.findOne({ name });
  if (existingPlan) {
    return next(
      AppError.conflict("Pricing plan with this name already exists")
    );
  }

  const pricingPlan = await PricingPlan.create({
    name,
    price,
    description,
    features,
    tier,
    isPopular,
    limits,
  });

  AppSuccess.created(pricingPlan).send(res);
});

// Get all Pricing Plans
export const getAllPricingPlans = asyncHandler(async (req, res, next) => {
  const plans = await PricingPlan.find();
  AppSuccess.ok(plans).send(res);
});

// Get a Pricing Plan by ID
export const getPricingPlanById = asyncHandler(async (req, res, next) => {
  const plan = await PricingPlan.findById(req.params.id);
  if (!plan) {
    return next(AppError.notFound("Pricing plan not found"));
  }
  AppSuccess.ok(plan).send(res);
});

// Update a Pricing Plan by ID
export const updatePricingPlan = asyncHandler(async (req, res, next) => {
  const plan = await PricingPlan.findById(req.params.id);
  if (!plan) {
    return next(AppError.notFound("Pricing plan not found"));
  }

  Object.assign(plan, req.body);
  await plan.save();

  AppSuccess.ok(plan).send(res);
});

// Delete a Pricing Plan by ID
export const deletePricingPlan = asyncHandler(async (req, res, next) => {
  const plan = await PricingPlan.findById(req.params.id);
  if (!plan) {
    return next(AppError.notFound("Pricing plan not found"));
  }

  await plan.remove();
  AppSuccess.ok({ message: "Pricing plan deleted successfully" }).send(res);
});
