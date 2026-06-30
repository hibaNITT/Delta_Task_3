const mongoose = require("mongoose");

// Defining how the video data will look
const VideoData = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  uploader: {
    // By using type: mongoose.Schema.Types.ObjectId and ref, we tell MongoDB: "Hey, this field links directly to another document inside the collection."
    // This establishes relationships across our entire platform!

    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array of User IDs who liked it
  viewCount: { type: Number, default: 0 },
  isPremier: { type: Boolean, default: false }, // For scheduled live premieres
  premierTime: { type: Date, default: null }, // Date/time scheduled for the premier
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Video", VideoData);
