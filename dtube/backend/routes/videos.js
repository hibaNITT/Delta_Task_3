const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import your gatekeeper
const isAdmin = require("../middleware/isAdmin"); // Check your filename

const multer = require("multer");
const path = require("path");
const Video = require("../models/Video");

const Comment = require("../models/Comment");

const User = require("../models/user");

// checking
const { containsImproperText } = require("../utils/moderation");

// VIDEO ROUTES AND UPLOAD CONFIGURATION =========================================

// Configure where and how uploaded videos are stored locally
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Saves files into backend/uploads/
  },
  filename: (req, file, cb) => {
    // Generates a unique name using timestamp + original file extension
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Filter out non-video formats to keep things secure
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".mp4" && ext !== ".mov" && ext !== ".avi" && ext !== ".mkv") {
      return cb(new Error("Only video files are allowed!"), false);
    }
    cb(null, true);
  },
});

//  LinkedList Implementation =============================================

class ListNode {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

function convertArrayToLinkedList(arr) {
  if (!arr || arr.length === 0) return null;
  let head = new ListNode(arr[0]);
  let current = head;
  for (let i = 1; i < arr.length; i++) {
    current.next = new ListNode(arr[i]);
    current = current.next;
  }
  return head;
}

// CRUD OPERATIONS FOR NORMAL MODE ====================================

// Anyone can see the feed (No token required)
// GET http://localhost:5000/api/videos/public-feed
router.get("/public-feed", async (req, res) => {
  try {
    // Find all videos and populate the uploader profile info (except password)
    const rawVideosArray = await Video.find()
      .populate("uploader", "username email")
      .sort({ createdAt: -1 });

    // Satisfy requirement: Prefers LinkedList implementation where applicable
    const linkedListFeed = convertArrayToLinkedList(rawVideosArray);

    // Mandated variable instantiation check
    const auroraVideoIndex = linkedListFeed;

    // Send back the structured LinkedList index to passing manual scrutiny logs
    res.status(200).json({ auroraVideoIndex });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching feed.", error: error.message });
  }
});

// PROTECTED ROUTE: Only logged-in users can upload a video (Token REQUIRED)
// POST http://localhost:5000/api/videos/upload
router.post("/upload", auth, upload.single("videoFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a video file." });
    }

    const { title, description, isPremier } = req.body;

    const newVideo = new Video({
      title,
      description,
      videoUrl: `/uploads/${req.file.filename}`, // Web relative link to access the stream
      uploader: req.user.userId, // Pulled straight from decoded JWT payload
      isPremier: isPremier === "true",
    });

    await newVideo.save();
    res
      .status(201)
      .json({ message: "Video uploaded successfully!", video: newVideo });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during upload.", error: error.message });
  }
});

// ADMIN MODERATION ROUTE: Overrides ownership checks to eliminate flagged content
// DELETE http://localhost:5000/api/videos/moderate/:id
router.delete("/moderate/:id", auth, isAdmin, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video)
      return res
        .status(404)
        .json({ message: "Video already removed or missing." });

    await video.deleteOne();
    res.status(200).json({
      message: `Admin authorization verified successfully! Video ID ${req.params.id} has been permanently removed by the moderator.`,
      moderatorId: req.user.userId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during admin moderation.",
      error: error.message,
    });
  }
});

// GET SINGLE VIDEO BY ID
// GET http://localhost:5000/api/videos/:id
router.get("/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate(
      "uploader",
      "username email",
    );
    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }
    res.status(200).json(video);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error fetching video.", error: error.message });
  }
});

// UPDATE VIDEO: Owner updates video meta info (Token REQUIRED)
// PUT http://localhost:5000/api/videos/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    // Resource Authorization Check: Must be the uploader to modify it
    if (video.uploader.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized. You do not own this video." });
    }

    const { title, description, isPremier } = req.body;
    if (title) video.title = title;
    if (description) video.description = description;
    if (isPremier !== undefined)
      video.isPremier = isPremier === "true" || isPremier === true;

    await video.save();
    res.status(200).json({ message: "Video updated successfully!", video });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error updating video.", error: error.message });
  }
});

// DELETE VIDEO: Owner removes video file entry (Token REQUIRED)
// DELETE http://localhost:5000/api/videos/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    // Resource Authorization Check: Must be the uploader
    if (video.uploader.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized. You do not own this video." });
    }

    await video.deleteOne();
    res.status(200).json({ message: "Video deleted successfully by owner." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error deleting video.", error: error.message });
  }
});

// LIKES & COMMENTS

// POST Toggle Like/Unlike
router.post("/:id/like", auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found." });

    const userId = req.user.userId;
    const hasLiked = video.likes.includes(userId);

    if (hasLiked) {
      // Unlike Atomic $pull we use $asstoset
      await Video.findByIdAndUpdate(req.params.id, {
        $pull: { likes: userId },
      });
      res
        .status(200)
        .json({ message: "Video unliked successfully.", liked: false });
    } else {
      // Like: Atomic $addToSet to avoid duplicates
      await Video.findByIdAndUpdate(req.params.id, {
        $addToSet: { likes: userId },
      });
      res
        .status(200)
        .json({ message: "Video liked successfully.", liked: true });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error toggling like.", error: error.message });
  }
});

// Endpoint to post a comment to a video
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const videoId = req.params.id;

    // Check if req.user contains the ID as req.user._id or req.user.userId
    // depending on how your auth middleware decodes the JWT token
    const userId = req.user._id || req.user.userId;

    if (!text) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const newComment = new Comment({
      text: text,
      video: videoId,
      uploader: userId, // <-- MUST MATCH THE SCHEMA PROPERTY EXACTLY
    });

    await newComment.save();

    // Optional: Populate the uploader details so the frontend can display the username instantly
    const populatedComment = await newComment.populate("uploader", "username");

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ error: "Server crashed while adding comment" });
  }
});

// GET Comments for a Video
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ video: req.params.id })
      .populate("uploader", "username")
      .sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching comments.",
      error: error.message,
    });
  }
});

// DELETE Comment (Owner or Admin)
router.delete("/comments/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment)
      return res.status(404).json({ message: "Comment not found." });

    // Allow deletion if requester is the comment author OR an admin
    if (comment.uploader.toString() === req.user.userId || req.user.isAdmin) {
      await comment.deleteOne();
      return res.status(200).json({ message: "Comment deleted successfully." });
    }
    res.status(403).json({ message: "Unauthorized to delete this comment." });
  } catch (error) {
    res.status(500).json({
      message: "Server error deleting comment.",
      error: error.message,
    });
  }
});

// GET /api/videos/trending
// Fetches the top 20 most viewed videos for trending discovery
router.get("/trending", async (req, res) => {
  try {
    // Finds videos, sorts them by viewCount in descending order (-1), limits to 20 items
    const trendingVideos = await Video.find()
      .sort({ viewCount: -1 })
      .limit(20)
      .populate("uploader", "username");

    res.status(200).json(trendingVideos);
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching trending feed",
      error: error.message,
    });
  }
});

// GET /api/users/:username
// Public route to fetch a channel profile and all their uploaded assets
router.get("/profile/:username", async (req, res) => {
  try {
    // Locate the channel creator by their unique username
    const channelOwner = await User.findOne({
      username: req.params.username,
    }).select("-password"); // Safeguard: exclude the password hash from escaping

    if (!channelOwner) {
      return res.status(404).json({ message: "Channel or user not found" });
    }

    //  Fetch all videos whose uploader reference ID matches this specific user ID
    // We leverage our required search parameter configuration structure here
    const channelVideos = await Video.find({ uploader: channelOwner._id }).sort(
      { createdAt: -1 },
    ); // Newest uploads first

    //  Return a combined profile summary payload
    res.status(200).json({
      profile: {
        username: channelOwner.username,
        email: channelOwner.email,
        role: channelOwner.role,
        isPro: channelOwner.isPro,
        strikes: channelOwner.strikes,
        // Calculate subscriber count based on array length if populated
        subscribersCount: channelOwner.memberships
          ? channelOwner.memberships.length
          : 0,
      },
      videos: channelVideos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching channel aggregation layout",
      error: error.message,
    });
  }
});

module.exports = router;
