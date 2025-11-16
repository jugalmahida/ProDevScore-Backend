import { User } from "../models/user.model.js";
import { UserSubscriptions } from "../models/usersubscriptions.model.js";
import { PricingPlan } from "../models/pricingplan.model.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { AppSuccess } from "../utils/AppSuccess.js";
import { AppConstants } from "../utils/Constants.js";
import { sendEmail } from "../config/email.config.js";
import { verificationCodeHtmlTemplate } from "../utils/EmailFormats/VerificationCode.js";
import { forgetPasswordHtmlTemplate } from "../utils/EmailFormats/ForgetPasswordVerify.js";
import { passwordResetSuccessHtmlTemplate } from "../utils/EmailFormats/ForgetPasswordResetDone.js";

import jwt from "jsonwebtoken";
import crypto from "crypto";

const checkSPUser = (email) => {
  return process.env.SP_USER === email;
};

const generateAndSendForgetPasswordToken = async (user) => {
  const randomData = crypto.randomBytes(16);
  const hexToken = randomData.toString("hex");
  const hashed = crypto.createHash("sha256").update(hexToken).digest("hex");

  user.forgetPasswordToken = hashed;
  user.forgetPasswordTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 Minute expiration
  await user.save({ validateBeforeSave: false });

  const link = `${
    process.env.NODE_ENV === "development"
      ? process.env.LOCAL_FRONTEND_URL
      : process.env.FRONTEND_URL
  }/reset-password/${hexToken}`;

  const verificationHtml = forgetPasswordHtmlTemplate(link);

  const sendEmailData = await sendEmail(
    user.email,
    "Email verification for password reset",
    verificationHtml
  );

  if (!sendEmailData) {
    return false;
  }
  return true;
};

const generateAndSendCode = async (user, next) => {
  if (user.verificationCode && !(user.expiresCodeAt < new Date())) {
    return next(
      AppError.badRequest("Verification code is already send to email")
    );
  }

  // Generate & Send Verification Code
  const verificationCode = AppConstants.getVerificationCode();
  user.verificationCode = verificationCode;
  user.expiresCodeAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
  user.save({ validateBeforeSave: false });
  const htmlContent = verificationCodeHtmlTemplate(verificationCode);

  const sendEmailData = await sendEmail(
    user.email,
    "ProDevScore Verification Code",
    htmlContent
  );

  if (!sendEmailData) {
    return false;
  }

  return true;
};

const verifyCode = async (user, code, next) => {
  if (!user || !code || !next) return;

  if (!user.verificationCode) {
    return next(AppError.badRequest("Code not found for this user"));
  }

  if (user.expiresCodeAt < new Date()) {
    return next(AppError.badRequest("Verification Code is expired"));
  }

  if (Number.parseInt(code) !== user.verificationCode) {
    return next(AppError.badRequest("Verification Code is invalid"));
  }

  user.verificationCode = undefined;
  user.expiresCodeAt = undefined;

  await user.save({ validateBeforeSave: false });

  return true;
};

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
    return next(AppError.conflict("User already exists"));
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
    userId: checkNewUser._id,
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

  const success = await generateAndSendCode(checkNewUser, next);

  if (!success) {
    return next(
      AppError.badRequest("Error in sending or saving verification code")
    );
  }
  AppSuccess.ok("User Registered & Verification Code Send to Email").send(res);
});

export const verifyCodeAndSetTokens = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return next(AppError.badRequest("Fields are missing"));
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    return next(AppError.badRequest("Invalid User"));
  }

  const success = await verifyCode(user, code, next);

  if (!success) {
    return next(AppError.internalError("Error while verify code"));
  }

  user.isVerified = 1;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateTokens(user);
  res
    .cookie("accessToken", accessToken, AppConstants.accessTokenOptions)
    .cookie("refreshToken", refreshToken, AppConstants.refreshTokenOptions);

  user.__v = undefined;
  user.refreshToken = undefined;
  user.expiresCodeAt = undefined;
  user.verificationCode = undefined;
  user.password = undefined;

  const userWithTokens = {
    user: user,
    tokens: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  };

  AppSuccess.ok(userWithTokens).send(res);
});

export const getCurrentUser = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  if (!userId) {
    return next(AppError.badRequest("Invalid User."));
  }
  // Reusable projections (exclude sensitive/system fields)
  const userProjection =
    "-password -refreshToken -verificationCode -expireCodeAt -createdAt -updatedAt -__v";
  const subsProjection = "-__v -createdAt -updatedAt -_id";

  // Run independent queries in parallel
  const [user, userSubscriptions] = await Promise.all([
    User.findById(userId).select(userProjection).lean(),
    UserSubscriptions.findOne({ userId })
      .select("-userId -__v -createdAt -updatedAt")
      .populate({
        path: "currentPlan",
        // Keep only allowed fields and explicitly drop _id in the populated doc
        select: "name price tier limits -_id",
      }),
  ]);

  if (!user) {
    return next(AppError.badRequest("Invalid User."));
  }

  if (!userSubscriptions) {
    return next(AppError.notFound("User subscriptions not found"));
  }

  // Single, well-shaped payload
  AppSuccess.ok({
    personalDetails: user,
    subscriptionsDetails: userSubscriptions,
  }).send(res);
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(AppError.badRequest("Email is required"));
  }

  const isSuperUser = checkSPUser(email);

  if (isSuperUser) {
    return next(AppError.unauthorized("Forget Password not allowed"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(AppError.badRequest("Invalid Email"));
  }

  const success = await generateAndSendForgetPasswordToken(user);

  if (!success) {
    return next(
      AppError.badRequest("Error in sending or saving verification token")
    );
  }
  AppSuccess.ok("Verification mail send to email").send(res);
});

export const verifyForgetPasswordTokenAndResetPassword = asyncHandler(
  async (req, res, next) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return next(AppError.badRequest("Token and new password are required"));
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      forgetPasswordToken: hashed,
      forgetPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(AppError.badRequest("Invalid or expired token"));
    }

    // Clear token fields before saving new password
    user.forgetPasswordToken = undefined;
    user.forgetPasswordTokenExpiry = undefined;
    user.password = newPassword;

    // Use validateBeforeSave: true to ensure password validation
    await user.save({ validateBeforeSave: true });

    const forgetPasswordDoneHtml = passwordResetSuccessHtmlTemplate(user.email);

    const sendEmailData = await sendEmail(
      user.email,
      "Password reset successfully",
      forgetPasswordDoneHtml
    );

    if (!sendEmailData) {
      return next(
        AppError.internalError("Error in sending success forget password email")
      );
    }

    AppSuccess.ok("Password reset successfully").send(res);
  }
);

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
    isVerified: 1,
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
  newUser.role = undefined;

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

  if (user.isVerified === 0) {
    const success = await generateAndSendCode(user, next);

    if (!success) {
      return next(
        AppError.badRequest("Error in sending or saving verification code")
      );
    }

    return next(
      AppError.unauthorized(
        "Unverified account identified, Verification code is sent to email",
        "USER_UNVERIFIED"
      )
    );
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  res
    .cookie("accessToken", accessToken, AppConstants.accessTokenOptions)
    .cookie("refreshToken", refreshToken, AppConstants.refreshTokenOptions);

  user.password = undefined;
  user.__v = undefined;
  user.refreshToken = undefined;
  user.role = undefined;

  const userWithTokens = {
    user,
    tokens: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  };
  AppSuccess.ok(userWithTokens).send(res);
});

export const changeUserPassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(AppError.badRequest("Fields are Missing"));
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(AppError.badRequest("Invalid User"));
  }

  const isSuperUser = checkSPUser(user?.email);

  if (isSuperUser) {
    return next(AppError.badRequest("Change Password not allowed"));
  }

  const passwordCorrect = user.isCorrectPassword(oldPassword);

  if (!passwordCorrect) {
    return next(AppError.unauthorized("Incorrect user password"));
  }

  user.password = newPassword;
  const upUser = await user.save({ validateBeforeSave: false }, { new: true });

  if (!upUser) {
    return next(AppError.internalError("Error in updating password"));
  }

  upUser.password = null;
  upUser.refreshToken = null;
  upUser.role = null;

  AppSuccess.ok("Password Updated successfully").send(res);
});

export const logoutUser = asyncHandler(async (req, res, next) => {
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
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    };
    AppSuccess.ok(dataToSend).send(res);
  } catch (error) {
    console.error("Error in refreshing token ", error);
    if (error.name === "TokenExpiredError") {
      return next(AppError.unauthorized("Token expired."));
    }
    if (error.name === "JsonWebTokenError") {
      return next(AppError.unauthorized("Invalid token."));
    }
    return next(AppError.internalError("Server error during refreshing token"));
  }
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError.badRequest("Id is Invalid or Missing"));
  }

  const user = await User.findOne({ _id: id });

  const isSuperUser = checkSPUser(user?.email);

  if (isSuperUser) {
    return next(AppError.badRequest("DELETE not allowed"));
  }

  const deletedFromUserCollection = await User.findByIdAndDelete(id);
  const deletedFromUserSubscriptionsCollection =
    await UserSubscriptions.findOneAndDelete({ userId: id });

  if (!deletedFromUserCollection || !deletedFromUserSubscriptionsCollection) {
    return next(AppError.badRequest("Invalid User"));
  }

  AppSuccess.ok("User Deleted successfully").send(res);
});

export const updateUser = asyncHandler(async (req, res, next) => {});

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}, { password: 0, __v: 0 });

  if (!users) {
    return next(AppError.notFound("User list is empty"));
  }

  AppSuccess.ok(users).send(res);
});
