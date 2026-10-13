require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const apiRoutes = require("./routes");

const app = express();

const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = [
  clientOrigin,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

// Enable CORS with credentials for cookie-based refresh tokens
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from our social app! 🚀");
});

// All API routes mounted under /api
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ message: "Something went wrong" });
});

module.exports = app;