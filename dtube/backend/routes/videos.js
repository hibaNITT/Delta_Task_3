// We will create a temporary video route file containing one open public route (for anyone to watch) and one locked private route .

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import your gatekeeper
const isAdmin = require("../middleware/isAdmin"); // Check your filename!

// PUBLIC ROUTE: Anyone can see the feed (No token required)
// GET http://localhost:5000/api/videos/public-feed
router.get("/public-feed", (req, res) => {
  res.status(200).json({
    message:
      "Welcome to the DTube Public Feed! No account required to view these clips.",
  });
});

// PROTECTED ROUTE: Only logged-in users can upload a video (Token REQUIRED)
// POST http://localhost:5000/api/videos/upload
router.post("/upload", auth, (req, res) => {
  // Because your middleware did 'req.user = decoded', we can access the user data securely here!
  res.status(201).json({
    message:
      "Access Granted! Video upload placeholder initialized successfully.",
    uploaderId: req.user.userId,
    uploaderRole: req.user.role,
  });
});

// ADMIN ONLY ROUTE: Delete/Moderate any video by its ID
// DELETE http://localhost:5000/api/videos/moderate/:id
router.delete("/moderate/:id", auth, isAdmin, (req, res) => {
  const videoId = req.params.id;

  res.status(200).json({
    message: `Admin authorization verified successfully! Video ID ${videoId} has been removed by the moderator.`,
    moderatorId: req.user.userId,
  });
});
module.exports = router;
