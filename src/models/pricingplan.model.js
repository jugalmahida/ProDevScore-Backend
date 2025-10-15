import mongoose from "mongoose";

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: {
    monthly: { type: Number, required: true },
    yearly: { type: Number, required: true },
    currency: { type: String, default: "INR" },
  },
  description: { type: String, require: true },
  features: { type: [String], require: true },
  tier: {
    type: String,
    required: true,
    enum: ["free", "pro"],
  },
  isPopular: { type: Boolean, default: false },
  limits: {
    repositories: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    contributors: {
      type: Number,
      required: true,
      min: 0,
      default: 2,
    },
    commits: {
      type: Number,
      required: true,
      min: 0,
      default: 3,
    },
  },
});
export const PricingPlan = mongoose.model("PricingPlan", pricingPlanSchema);
