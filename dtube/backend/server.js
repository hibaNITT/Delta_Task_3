const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const videoRoutes = require("./routes/videos");
const analyticsRoutes = require("./routes/analytics");
const flagRoutes = require("./routes/flags");

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

// mounting flags routes
app.use("/api/flags", flagRoutes);

// mounting user profile viewoing route
app.use("/api/users", require("./routes/videos"));

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
const server = app.listen(PORT, () => {
  console.log(` Server running smoothly on port ${PORT}`);
});
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// WEBSOCKET NATIVE SERVER FOR LIVE CHAT PREMIERES
const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ server });
const jwt = require("jsonwebtoken");
const User = require("./models/user");

// Keep track of rooms: videoId -> Set of ws connections
const rooms = new Map();

wss.on("connection", (ws) => {
  console.log("New WebSocket connection established.");
  let currentVideoId = null;

  ws.on("message", async (messageStr) => {
    try {
      const message = JSON.parse(messageStr);

      // Handle user joining a specific video's live chat room
      if (message.type === "join") {
        const { videoId } = message;
        currentVideoId = videoId;

        if (!rooms.has(videoId)) {
          rooms.set(videoId, new Set());
        }
        rooms.get(videoId).add(ws);
        console.log(`User joined chat room for video: ${videoId}`);
      }

      // Handle user sending a chat message
      else if (message.type === "message") {
        const { videoId, text, token } = message;
        if (!text || !token) return;

        // Verify the user's JWT token
        try {
          const decoded = jwt.verify(
            token,
            process.env.DTUBE_CONSTELLATION_Conspiracy_SECRET,
          );

          // Fetch the user's details to get their username
          const user = await User.findById(decoded.userId);
          if (!user) return;

          const chatPayload = {
            type: "chat",
            username: user.username,
            userId: user._id,
            text: text,
            createdAt: new Date(),
          };

          // Broadcast to everyone in the room
          const roomConnections = rooms.get(videoId);
          if (roomConnections) {
            const payloadStr = JSON.stringify(chatPayload);
            roomConnections.forEach((client) => {
              if (client.readyState === 1) {
                // 1 means OPEN
                client.send(payloadStr);
              }
            });
          }
        } catch (err) {
          console.error("WebSocket JWT verification failed:", err.message);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid authentication token.",
            }),
          );
        }
      }
    } catch (err) {
      console.error("Error parsing WebSocket message:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed.");
    if (currentVideoId && rooms.has(currentVideoId)) {
      const room = rooms.get(currentVideoId);
      room.delete(ws);
      if (room.size === 0) {
        rooms.delete(currentVideoId);
      }
    }
  });
});
