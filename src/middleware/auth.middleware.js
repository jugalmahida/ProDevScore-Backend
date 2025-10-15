import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";

export const authMiddleware = asyncHandler(async (req, _, next) => {
  // Get the token from cookies or authorization header
  let userFromDB;
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(AppError.unauthorized("Access denied.."));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    userFromDB = await User.findById(decoded?._id).select(
      "-password -verificationCode -expiresAt"
    );

    if (!userFromDB) {
      AppError.notFound("Invalid User Access Token");
    }

    // Attach the decoded user data to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in token validation ", error);
    // Handle different JWT errors specifically
    if (error.name === "TokenExpiredError") {
      return next(AppError.unauthorized("Token expired."));
    }
    if (error.name === "JsonWebTokenError") {
      return next(AppError.unauthorized("Invalid token."));
    }
    return next(AppError.unauthorized("Authentication failed."));
  }
});

// Role restriction middleware generator
const restrictTo = (...roles) => {
  return asyncHandler(async (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden("Access Denied."));
    }
    next();
  });
};

export const isAdmin = restrictTo("admin");
export const isAdminOrUser = restrictTo("admin", "user");
