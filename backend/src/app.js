import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(cookieParser());

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";
app.use("/api/v1/auth", authRoutes); // Auth Routes
app.use("/api/v1/users", userRoutes); // User Routes
app.use("/api/v1/data", dataRoutes); // Data Routes 

app.use(errorHandler);

export { app };
