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
};
