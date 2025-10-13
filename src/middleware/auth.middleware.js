import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  // Get the token from cookies or authorization header
  const token =
    req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(AppError.unauthorized("Access denied.."));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user data to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
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
