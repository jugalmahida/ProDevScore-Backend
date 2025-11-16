import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { setupRoutes } from "./config/routes.config.js";
import { setupErrorHandling } from "./config/errors.config.js";
import { connectDB } from "./config/db.config.js";
import { AppConstants } from "./utils/Constants.js";
import { initializeSocket } from "./config/socket.config.js";

const app = express();

const httpServer = http.createServer(app);
const io = initializeSocket(httpServer);
// Connection to the db
await connectDB();

const corsOptions = {
  origin: AppConstants.frontendUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoints (must be before error handling)
app.get(`/api/${process.env.VERSION}/health`, (req, res) => {
  res.json({
    status: "OK",
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    version: process.env.VERSION,
    socketConnections: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

setupRoutes(app);
setupErrorHandling(app);

httpServer.listen(process.env.PORT, () => {
  console.log(`Server Running at ${process.env.PORT}`);
});
