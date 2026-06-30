const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

// We will use Node's native crypto library to generate a random string for the token.
const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const axios = require("axios");
const jwt = require("jsonwebtoken");

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

    res.status(200).json({
      message:
        "Password updated successfully! You can now log in with your new credentials.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error during reset-password operation." });
  }
});

// GOOGLE AUTH

// @route   GET /api/auth/google/callback
// @desc    Handle the code redirect parameter, swap for token, get details, issue app JWT
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res
      .status(400)
      .json({
        message: "Authorization code missing from Google redirect context.",
      });
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:5000/api/auth/google/callback",
        grant_type: "authorization_code",
      },
    );

    const { access_token } = tokenResponse.data;

    // 2. Query Google userinfo resource endpoint using the access token
    const userinfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const { email, name, sub: googleId } = userinfoResponse.data;

    // 3. Find or create the user in the database
    let user = await User.findOne({ email });

    if (!user) {
      // Create a unique username if the Google name has a collision
      let baseUsername = name || email.split("@")[0];
      let username = baseUsername;
      let count = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${count}`;
        count++;
      }

      // Create a new hacker-ready user profile with no manual password required
      user = new User({
        username: username,
        email: email,
        authProvider: "google",
        role: "user",
        isPro: false,
        strikes: 0,
      });
      await user.save();
    }

    // 4. Sign our own native application JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.DTUBE_CONSTELLATION_Conspiracy_SECRET,
      { expiresIn: "7d" },
    );

    // 5. Send the token back to the frontend browser by redirecting with URL parameters
    // This completes the loop and lets the React client extract the token securely.
    res.redirect(
      `http://localhost:5173/login?token=${token}&id=${user._id}&username=${encodeURIComponent(user.username)}&email=${encodeURIComponent(user.email)}&role=${user.role}&isPro=${user.isPro}`,
    );
  } catch (error) {
    console.error(
      "OAuth Exchange Failure Error Details:",
      error.response?.data || error.message,
    );
    res
      .status(500)
      .send(
        "Authentication handling failed due to upstream identity validation parameters.",
      );
  }
});

module.exports = router;
