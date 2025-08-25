import express from "express";
import cors from "cors";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
const app = express();

//basic middleware configurations to parse JSON requests:
app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));

// Importing and using the  routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", authRouter);

// CORS middleware configuration to allow cross-origin requests
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"],
  })
);

//basic route handlers:
app.get("/", (req, res) => {
  res.send("Hello AI World!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
  res.send("Server is healthy!");
});

export default app;
