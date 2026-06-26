const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // Null means an unauthenticated/guest user viewed it
  },
  eventType: {
    type: String,
    enum: ["click", "watch_progress"],
    required: true,
  },
  watchTimeSeconds: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Analytics", AnalyticsSchema);

// videoId and userId Relationships: We link this event explicitly back to our existing collections using ref.
//  This allows an admin to quickly look up which videos are generating traffic.

// enum: ['click', 'watch_progress']: Enums act as validators.
//  It ensures that the database will reject any typoed event types, accepting only explicit tracking actions.

// Guest Tracking (default: null): By not setting required:
// true on userId, we ensure that if an anonymous person clicks a video on the platform, our analytics system still registers the view.
