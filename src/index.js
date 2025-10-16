import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { setupRoutes } from "./config/routes.config.js";
import { setupErrorHandling } from "./config/errors.config.js";
import { connectDB } from "./config/db.config.js";
import { AppConstants } from "./utils/Constants.js";
import { initializeSocket } from "./config/socket.config.js";
import cookieParser from "cookie-parser";

const app = express();

const httpServer = http.createServer(app);

const io = initializeSocket(httpServer);

// Connection to the db
await connectDB();

const corsOptions = {
  origin: [AppConstants.frontendUrl, "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

setupRoutes(app);
setupErrorHandling(app);

httpServer.listen(process.env.PORT, () => {
  console.log(`Server Running at ${process.env.PORT}`);
});
