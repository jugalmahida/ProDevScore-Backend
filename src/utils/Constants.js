import crypto from "crypto";

// maxAge: 3 * 60 * 60 * 1000 <= 3 hours
// maxAge: 10 * 60 * 1000, <= 10 minutes
// maxAge: 3 * 24 * 60 * 60 * 1000, <= 3 days

export const AppConstants = {
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  accessTokenOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
    ...(process.env.NODE_ENV === "production" && {
      domain: ".jugalmahida.com",
    }),
  },

  refreshTokenOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    ...(process.env.NODE_ENV === "production" && {
      domain: ".jugalmahida.com",
    }),
  },

  getVerificationCode: () => {
    return crypto.randomInt(1000, 9999);
  },
};
