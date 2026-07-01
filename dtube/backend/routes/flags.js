const express = require("express");
const router = express.Router();
const Flag = require("../models/flag");
const Comment = require("../models/comment");
const Video = require("../models/video");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// User: Flag a comment as malicious
router.post("/comment/:commentId", auth, async (req, res) => {
  try {
    const { reason, description } = req.body;

    // Check if comment exists
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user already flagged this comment
    const existingFlag = await Flag.findOne({
      type: "comment",
      targetId: req.params.commentId,
      reportedBy: req.user.userId,
    });

    if (existingFlag) {
      return res
        .status(400)
        .json({ message: "You already reported this comment" });
    }

    // Create flag
    const flag = new Flag({
      type: "comment",
      targetId: req.params.commentId,
      reason,
      description,
      reportedBy: req.user.userId,
    });

    await flag.save();
    res.status(201).json({ message: "Comment flagged successfully", flag });
  } catch (error) {
    res.status(500).json({ message: "Error flagging comment", error });
  }
});

// User: Flag a video for copyright strike
router.post("/video/:videoId", auth, async (req, res) => {
  try {
    const { reason, description } = req.body;

    // Check if video exists
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if user already flagged this video
    const existingFlag = await Flag.findOne({
      type: "video",
      targetId: req.params.videoId,
      reportedBy: req.user.userId,
    });

    if (existingFlag) {
      return res
        .status(400)
        .json({ message: "You already reported this video" });
    }

    // Create flag
    const flag = new Flag({
      type: "video",
      targetId: req.params.videoId,
      reason,
      description,
      reportedBy: req.user.userId,
    });

    await flag.save();
    res.status(201).json({ message: "Video flagged successfully", flag });
  } catch (error) {
    res.status(500).json({ message: "Error flagging video", error });
  }
});

// Admin: Get all pending flags
router.get("/admin/pending", auth, isAdmin, async (req, res) => {
  try {
    const flags = await Flag.find({ status: "pending" })
      .populate("reportedBy", "username email")
      .populate("targetId")
      .sort({ createdAt: -1 });

    res.json(flags);
  } catch (error) {
    res.status(500).json({ message: "Error fetching flags", error });
  }
});

// Admin: Resolve a flag
router.put("/admin/:flagId", auth, isAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const flag = await Flag.findById(req.params.flagId);
    if (!flag) {
      return res.status(404).json({ message: "Flag not found" });
    }

    flag.status = status;
    flag.adminNotes = adminNotes;
    flag.resolvedBy = req.user.userId;

    // If resolved by removing content
    if (status === "resolved") {
      if (flag.type === "comment") {
        await Comment.findByIdAndDelete(flag.targetId);
      } else if (flag.type === "video") {
        await Video.findByIdAndDelete(flag.targetId);
      }
    }

    await flag.save();
    res.json({ message: "Flag resolved", flag });
  } catch (error) {
    res.status(500).json({ message: "Error resolving flag", error });
  }
});

module.exports = router;
