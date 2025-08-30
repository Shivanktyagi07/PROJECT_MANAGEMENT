// ---------------------------
// Importing Dependencies
// ---------------------------
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Importing Route Modules
import healthcheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";

// Create Express app instance
const app = express();

// ---------------------------
// Middleware Configuration
// ---------------------------

// Parse incoming JSON requests with a size limit of 16kb
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded request bodies (form data) with a size limit of 16kb
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

// Serve static files from the "public" folder
app.use(express.static("public"));

// why we can use cookie directly cuz express doesn't have built-in cookie parsing middleware
app.use(cookieParser());

// ---------------------------
// Routes Configuration
// ---------------------------

// Healthcheck routes (e.g., check if server is alive)
app.use("/api/v1/healthcheck", healthcheckRouter);

// Authentication routes (e.g., login, register, etc.)
app.use("/api/v1/auth", authRouter);

// ---------------------------
// CORS Configuration
// ---------------------------

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    // Allowed origins (from .env OR fallback to localhost:5173)
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",

    // Allow sending cookies/authorization headers
    credentials: true,

    // Allowed HTTP methods
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    // Allowed headers in requests
    allowedHeaders: ["content-type", "authorization"],
  })
);

// ---------------------------
// Basic Route Handlers
// ---------------------------

// Root endpoint (basic test route)
app.get("/", (req, res) => {
  res.send("Hello AI World!");
});

// Health endpoint (used for uptime monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
  // ⚠️ Note: Calling res.send after res.json here won’t execute (only the first response works)
});

export default app;
