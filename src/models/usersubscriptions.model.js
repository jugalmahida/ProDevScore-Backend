import mongoose from "mongoose";
const userSubscriptions = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "PricingPlan",
    },
    currentUsage: {
      repositories: {
        type: Number,
        default: 0,
        min: 0,
      },
      commits: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastResetDate: {  
        type: Date,
        default: Date.now,
      },
    },

    // Subscription Dates
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    renewalDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserSubscriptions = mongoose.model(
  "UserSubscriptions",
  userSubscriptions
);
