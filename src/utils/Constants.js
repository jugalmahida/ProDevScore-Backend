export class AppConstants {
  static frontendUrl = "http://localhost:3000";
  static backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  // Check if we're in production (HTTPS)
  static isProduction = process.env.NODE_ENV === "production";

  static accessTokenOptions = {
    httpOnly: true,
    secure: this.isProduction, // Only secure in production
    sameSite: this.isProduction ? "none" : "lax", // 'none' for cross-site in prod
    maxAge: 30 * 60 * 1000, // 30 minutes
    path: "/",
  };

  static refreshTokenOptions = {
    httpOnly: true,
    secure: this.isProduction, // Only secure in production
    sameSite: this.isProduction ? "none" : "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    path: "/",
  };
}
