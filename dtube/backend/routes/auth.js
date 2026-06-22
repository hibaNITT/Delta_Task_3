const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

// We will use Node's native crypto library to generate a random string for the token.
const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.post("/signup", signup);
router.post("/login", login);

// 1. FORGOT PASSWORD: Request a reset token
// POST http://localhost:5000/api/auth/forgot-password

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with that email address." });
    }

    // Generate a random 20-character hex string token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Save token and set expiration to exactly 1 hour from now
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds
    await user.save();

    //  Print the link directly to our terminal console for testing
    console.log(`\n==========  PASSWORD RESET EMAIL  ==========`);
    console.log(`To reset your password, send a POST request to:`);
    console.log(`http://localhost:5000/api/auth/reset-password/${resetToken}`);
    console.log(`======================================================\n`);

    res.status(200).json({
      message:
        "Password reset link generated successfully! (Check your server terminal console for the link).",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during forgot-password routine." });
  }
});

// 2. RESET PASSWORD: Submit new password using token
// POST http://localhost:5000/api/auth/reset-password/:token

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Find a user who matches this token AND where the expiration date is still in the future
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // $gt means "Greater Than"
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }

    // Securely hash the new password entry before writing to DB
    user.passwordHash = await bcrypt.hash(password, 10);

    // Clean out the temporary token fields so they can't be reused
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res
      .status(200)
      .json({
        message:
          "Password updated successfully! You can now log in with your new credentials.",
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during reset-password operation." });
  }
});

module.exports = router;
