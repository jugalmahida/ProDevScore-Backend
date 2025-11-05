import mongoose from "mongoose";

const userSubscriptions = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },

    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PricingPlan",
      require: true,
    },

    currentUsage: {
      totalRepositories: {
        type: Number,
        required: true,
        default: 0,
      },

      usedRepositories: { type: [String], default: [] },
      usedContributors: { type: [String], default: [] },

      totalCommits: {
        type: Number,
        required: true,
        default: 0,
      },

      totalContributors: {
        type: Number,
        required: true,
        default: 0,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// userSubscriptions.virtual("remainingUsage").get(function () {
//   return {
//     totalRepositories:
//       this.currentPlan.limits.repositories -
//       this.currentUsage.totalRepositories,
//     totalCommits:
//       this.currentPlan.limits.commitsPerContributor -
//       this.currentUsage.totalCommits,
//     totalContributors:
//       this.currentPlan.limits.contributors -
//       this.currentUsage.totalContributors,
//   };
// });

export const UserSubscriptions = mongoose.model(
  "UserSubscriptions",
  userSubscriptions
);
