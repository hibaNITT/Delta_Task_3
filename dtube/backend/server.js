const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const videoRoutes = require("./routes/videos");
const analyticsRoutes = require("./routes/analytics");

// Imports Cross-Origin Resource Sharing (CORS). This is a security feature helper; it allows our React frontend which is running on a different port to talk to this
// backend port without being blocked by the browser.
// cors makes sure our React frontend is allowed to talk to this backend.
const cors = require("cors");

// Loads our secret environment variables
require("dotenv").config();

const app = express();

const path = require("path");

// Middleware
app.use(express.json()); // Allows server to read JSON data
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
); // Permits communication with our frontend code

//telling express to expose our uploads folder public
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mounting auth routing
app.use("/api/auth", authRoutes);

// mounting video routes
app.use("/api/videos", videoRoutes);

// mounting analytics routes
app.use("/api/analytics", analyticsRoutes);

// mounting user profile viewoing route
app.use("/api/users", require("./routes/users"));

// Connect to MongoDB Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" DTube Database Successfully Connected!"))
  .catch((err) => console.error(" Database Connection Error:", err));

// Fallback Status Route
app.get("/", (req, res) => {
  res.send("DTube Backend Engine is Active");
});

// Health Check Route
// an /api/health route is called a Health Check Endpoint.

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start listening for connections
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running smoothly on port ${PORT}`);
});
