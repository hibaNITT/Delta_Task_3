const mongoose = require("mongoose");

// Define how user data will look
// what information a user document must contain when it is saved in the database.
const UserData = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }, // Assign access rights
  isPro: { type: Boolean, default: false }, // For DTube Pro membership
  memberships: [{ type: String }], // Array of channel IDs they joined
  strikes: { type: Number, default: 0 }, // Automated warning count for violations
});

// Compiles this blueprint into a working model named 'User' and exports it so you can import and use it
module.exports = mongoose.model("User", UserData);
