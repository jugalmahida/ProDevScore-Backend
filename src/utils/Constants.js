export class AppConstants {
  static frontendUrl = "http://localhost:3000";

  static accessTokenOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 30 * 60 * 1000, // For 30 Minutes
  };

  static refreshTokenOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 3 * 24 * 60 * 60 * 1000, // For 3 days
  };
}
