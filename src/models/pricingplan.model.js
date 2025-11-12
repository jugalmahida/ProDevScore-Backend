import mongoose from "mongoose";

const pricingPlanSchema = new mongoose.Schema(
  {
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
      enum: ["free", "pro", "enterprise"],
    },
    isPopular: { type: Boolean, default: false },
    limits: {
      repositories: {
        type: Number,
        required: true,
        default: 1,
      },
      contributors: {
        type: Number,
        required: true,
        default: 2,
      },
      commitsPerContributor: {
        type: Number,
        required: true,
        min: 0,
        default: 3,
      },
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// count total commit limit in a particular plan 
pricingPlanSchema.virtual("limits.totalCommitReviews").get(function () {
  const c = this.limits.contributors ?? 0;
  const p = this.limits.commitsPerContributor ?? 0;
  return c * p;
});

export const PricingPlan = mongoose.model("PricingPlan", pricingPlanSchema);
