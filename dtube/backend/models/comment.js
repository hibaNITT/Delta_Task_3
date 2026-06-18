const mongoose = require("mongoose");

// Define how comment data will look
const CommentData = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  }, // Links to the specific video
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Links to the user who wrote it
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }, // Automatically records when the comment was posted
});

module.exports = mongoose.model("Comment", CommentData);
