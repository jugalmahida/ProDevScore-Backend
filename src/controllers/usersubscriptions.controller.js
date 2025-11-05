import { UserSubscriptions } from "../models/usersubscriptions.model.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { AppSuccess } from "../utils/AppSuccess.js";

export const getCurrentUserSubscriptions = asyncHandler(
  async (req, res, next) => {
    const userSubscriptions = await UserSubscriptions.findOne(
      {
        userId: req.user._id,
      },
      { __v: 0, createdAt: 0, updatedAt: 0 }
    ).populate("currentPlan", "name price tier limits");

    if (!userSubscriptions) {
      return next(AppError.notFound("User subscriptions not found"));
    }

    AppSuccess.ok(userSubscriptions).send(res);
  }
);

export const getUserSubscriptions = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(AppError.badRequest("Id is Invalid or Missing"));
  }

  const userSubscriptions = await UserSubscriptions.findOne(
    {
      userId: userId,
    },
    { __v: 0, createdAt: 0, updatedAt: 0 }
  ).populate("currentPlan", "name price tier limits");

  if (!userSubscriptions) {
    return next(AppError.notFound("User subscriptions not found"));
  }

  AppSuccess.ok(userSubscriptions).send(res);
});
