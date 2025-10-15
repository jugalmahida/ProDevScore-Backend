import { User } from "../models/user.model.js";
import { UserSubscriptions } from "../models/usersubscriptions.model.js";
import { PricingPlan } from "../models/pricingplan.model.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppSuccess } from "../utils/AppSuccess.js";
import { AppConstants } from "../utils/Constants.js";
import jwt from "jsonwebtoken";

const generateTokens = async (user) => {
  if (!user) return;

  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Error in generating tokens ", error);
    AppError.internalError("Error in generating tokens");
    return;
  }
};

export const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(AppError.badRequest("Fields are missing"));
  }

  const exitingUser = await User.findOne({ email: email });
  if (exitingUser) {
    next(AppError.conflict("User already exists"));
  }

  const newUser = await User.create({
    fullName: fullName,
    email: email,
    password: password,
  });

  const checkNewUser = await User.findOne({ _id: newUser._id }).select(
    "-password -verificationCode -expiresAt -refreshToken"
  );

  if (!checkNewUser) {
    next(
      AppError.internalError(
        "Error in creating new user, try again after sometime"
      )
    );
  }

  const freePlan = await PricingPlan.findOne({ tier: "free" });

  if (!freePlan) {
    return AppError.internalError("Free plan configuration error");
  }

  const now = new Date();
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(now.getMonth() + 1);

  await UserSubscriptions.create({
    userId: newUser._id,
    currentPlan: freePlan._id,
    currentUsage: {
      repositories: 0,
      commits: 0,
      lastResetDate: now,
    },
    startDate: now,
    endDate: oneMonthLater,
    renewalDate: oneMonthLater,
  });

  const { accessToken, refreshToken } = await generateTokens(checkNewUser);

  // maxAge: 3 * 60 * 60 * 1000 <= 3 hours
  // maxAge: 10 * 60 * 1000, <= 10 minutes
  // maxAge: 3 * 24 * 60 * 60 * 1000, <= 3 days

  res
    .cookie("accessToken", accessToken, AppConstants.accessTokenOptions)
    .cookie("refreshToken", refreshToken, AppConstants.refreshTokenOptions);

  checkNewUser.__v = undefined;
  checkNewUser.refreshToken = undefined;

  const userWithTokens = {
    user: checkNewUser,
    tokens: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  };

  AppSuccess.ok(userWithTokens).send(res);
});

export const registerAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(AppError.badRequest("Fields are missing"));
  }

  const exitingUser = await User.findOne({ email: email });
  if (exitingUser) {
    next(AppError.conflict("User already exists"));
  }

  const newUser = await User.create({
    fullName: fullName,
    email: email,
    password: password,
    role: "admin",
  });

  const proPlan = await PricingPlan.findOne({ tier: "pro" });

  if (!proPlan) {
    return AppError.internalError("pro plan configuration error");
  }

  const now = new Date();
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(now.getMonth() + 1);

  await UserSubscriptions.create({
    userId: newUser._id,
    currentPlan: proPlan._id,
    currentUsage: {
      repositories: 0,
      commits: 0,
      lastResetDate: now,
    },
    startDate: now,
    endDate: oneMonthLater,
    renewalDate: oneMonthLater,
  });

  newUser.password = undefined;

  AppSuccess.ok(newUser).send(res);
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(AppError.badRequest("Fields are missing"));
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    return next(AppError.notFound("Incorrect Email"));
  }

  const isCorrect = await user.isCorrectPassword(password);

  if (!isCorrect) {
    return next(AppError.unauthorized("Incorrect Password"));
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  res
    .cookie("accessToken", accessToken, AppConstants.accessTokenOptions)
    .cookie("refreshToken", refreshToken, AppConstants.refreshTokenOptions);

  user.password = undefined;
  user.__v = undefined;
  user.refreshToken = undefined;

  const userWithTokens = {
    user,
    tokens: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  };
  AppSuccess.ok(userWithTokens).send(res);
});

export const PasswordResetUser = asyncHandler(async (req, res, next) => {});

export const logoutUser = asyncHandler(async (req, res, next) => {
  console.log(req.user);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: null },
    },
    { new: true }
  );

  res.clearCookie("refreshToken").clearCookie("accessToken");

  AppSuccess.noContent().send(res);
});

export const refreshTokens = asyncHandler(async (req, res, next) => {
  const icToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!icToken || typeof icToken !== "string" || icToken.length < 10) {
    return next(AppError.badRequest("Refresh token is missing"));
  }

  try {
    const decodedToken = jwt.verify(icToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -verificationCode -expiresAt"
    );

    if (!user) {
      return next(AppError.notFound("Invalid Token"));
    }
    if (user?.refreshToken !== icToken) {
      return next(AppError.notFound("Invalid Token or Token is expired"));
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res
      .cookie("accessToken", accessToken, AppConstants.accessTokenOptions)
      .cookie("refreshToken", refreshToken, AppConstants.refreshTokenOptions);

    const dataToSend = {
      userEmail: user.email,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    AppSuccess.ok(dataToSend).send(res);
  } catch (error) {
    console.error("Error in refreshing token ", error);
    return next(AppError.internalError("Server error during refreshing token"));
  }
});

export const updateUser = asyncHandler(async (req, res, next) => {});

export const getAllUsers = asyncHandler(async (req, res, next) => {});
