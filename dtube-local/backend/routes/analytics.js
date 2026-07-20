const express = require("express");
const router = express.Router();
const Analytics = require("../models/analytics");
const auth = require("../middleware/auth"); // For capturing authenticated user id if available
const isAdmin = require("../middleware/isAdmin"); // To restrict metric views to admins only

// Record an Analytics Event (Public/Guest or logged-in users)
router.post("/log", async (req, res) => {
  try {
    const { videoId, eventType, watchTimeSeconds } = req.body;

    // Create a new event object
    const newEvent = new Analytics({
      videoId,
      eventType,
      watchTimeSeconds: watchTimeSeconds || 0,
      userId: req.user ? req.user.userId : null,
      // Save user ID if a valid auth token was parsed, else save as guest
    });

    await newEvent.save();
    res.status(201).json({ message: "Analytics recorded successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server error tracking analytics",
      error: error.message,
    });
  }
});

//  Get Platform Summary (Protected: Admin Only)
router.get("/admin-dashboard", auth, isAdmin, async (req, res) => {
  try {
    // Total clicks recorded on the platform
    const totalClicks = await Analytics.countDocuments({ eventType: "click" });

    // watch progress records to calculate total watch time
    const totalWatchData = await Analytics.aggregate([
      { $match: { eventType: "watch_progress" } },
      { $group: { _id: null, totalSeconds: { $sum: "$watchTimeSeconds" } } },
    ]);

    const totalWatchTime =
      totalWatchData.length > 0 ? totalWatchData[0].totalSeconds : 0;

    res.json({
      totalClicks,
      totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error compiling statistics", error: error.message });
  }
});

module.exports = router;
