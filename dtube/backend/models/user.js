const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isPro: { type: Boolean, default: false },
    memberships: [{ type: String }], // Array of channel/user IDs joined
    strikes: { type: Number, default: 0 },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
