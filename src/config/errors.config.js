// config/errorHandling.js - Error handling configuration
import { AppError } from "../utils/AppError.js";

export const setupErrorHandling = (app) => {
  // 404 handler for undefined routes
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    // console.error("Global error handler:", {
    //   error: err.message,
    //   stack: err.stack,
    //   url: req.url,
    //   method: req.method,
    //   ip: req.ip,
    //   timestamp: new Date().toISOString(),
    // });

    const isDevelopment = process.env.NODE_ENV === "development";

    // Check for AppError instance first (uses statusCode)
    if (err instanceof AppError) {
      return err.send(res);
    }

    // Fallback for other errors
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
      success: false,
      message: isDevelopment ? err.message : "Internal server error",
      ...(isDevelopment && { stack: err.stack }),
    });
  });
};
