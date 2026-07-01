const mongoose = require("mongoose");

const FlagSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["comment", "video"], required: true },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      enum: ["malicious", "copyright", "spam", "harassment", "other"],
      required: true,
    },
    description: { type: String, trim: true },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    adminNotes: { type: String, default: null },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Flag", FlagSchema);
