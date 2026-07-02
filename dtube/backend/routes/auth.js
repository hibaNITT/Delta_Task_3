const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

// We will use Node's native crypto library to generate a random string for the token.
const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");

const axios = require("axios");
const jwt = require("jsonwebtoken");

const FRONTEND_HOME_URL = process.env.FRONTEND_HOME_URL || "http://localhost:5173";
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";
const DAUTH_BASE_URL = (
  process.env.DAUTH_BASE_URL || "https://auth.delta.nitt.edu"
).replace(/\/$/, "");
const DAUTH_AUTHORIZE_PATH =
  process.env.DAUTH_AUTHORIZE_PATH || "/authorize";
const DAUTH_CALLBACK_URL =
  process.env.DAUTH_CALLBACK_URL ||
  "http://localhost:5000/api/auth/dauth/callback";
const DAUTH_SCOPE = process.env.DAUTH_SCOPE || "email openid profile user";

const buildFrontendAuthRedirect = (token, user, provider) => {
  const params = new URLSearchParams({
    token,
    id: String(user._id),
    username: user.username,
    email: user.email,
    role: user.role,
    isPro: String(user.isPro),
    provider,
  });

  return `${FRONTEND_HOME_URL}/auth?${params.toString()}`;
};

const buildUniqueUsername = async (rawName, fallbackEmail) => {
  const fallback = fallbackEmail ? fallbackEmail.split("@")[0] : "dauth_user";
  const baseUsername = String(rawName || fallback)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "")
    .slice(0, 32) || fallback;

  let username = baseUsername;
  let count = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}${count}`;
    count++;
  }

  return username;
};

const getDauthUserValue = (payload, keys) => {
  for (const key of keys) {
    const value =
      payload?.[key] ||
      payload?.user?.[key] ||
      payload?.data?.[key] ||
      payload?.resource?.[key];
    if (value) return value;
  }
  return null;
};

const getDauthErrorMessage = (error) => {
  const details = error.response?.data;
  if (!details) return error.message;
  if (typeof details === "string") return details;
  return details.message || details.error || JSON.stringify(details);
};

const signAppToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.DTUBE_CONSTELLATION_Conspiracy_SECRET,
    { expiresIn: "7d" },
  );

router.post("/signup", signup);
router.post("/login", login);

// DTube Pro: mock monthly subscription endpoint.
router.post("/pro/subscribe", authMiddleware, async (req, res) => {
  try {
    const proExpiresAt = new Date();
    proExpiresAt.setMonth(proExpiresAt.getMonth() + 1);

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { isPro: true, proExpiresAt },
      { new: true },
    ).select("_id username email role isPro proExpiresAt");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      message: "DTube Pro activated for one month.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPro: user.isPro,
        proExpiresAt: user.proExpiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Could not activate DTube Pro." });
  }
});

// DAUTH AUTH

// @route   GET /api/auth/dauth/start
// @desc    Redirect the browser to DAuth's authorize screen
router.get("/dauth/start", (req, res) => {
  if (!process.env.DAUTH_CLIENT_ID || !process.env.DAUTH_CLIENT_SECRET) {
    return res.status(500).send("DAuth client credentials are not configured.");
  }

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.DAUTH_CLIENT_ID,
    redirect_uri: DAUTH_CALLBACK_URL,
    response_type: "code",
    grant_type: "authorization_code",
    scope: DAUTH_SCOPE,
    state,
    nonce,
  });

  res.redirect(`${DAUTH_BASE_URL}${DAUTH_AUTHORIZE_PATH}?${params.toString()}`);
});

// @route   GET /api/auth/dauth/callback
// @desc    Exchange DAuth code for token, fetch user details, issue app JWT
router.get("/dauth/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Authorization code missing from DAuth redirect." });
  }

  let callbackStep = "token";

  try {
    const tokenRequestBody = new URLSearchParams({
      client_id: process.env.DAUTH_CLIENT_ID,
      client_secret: process.env.DAUTH_CLIENT_SECRET,
      redirect_uri: DAUTH_CALLBACK_URL,
      grant_type: "authorization_code",
      code,
    });

    const tokenResponse = await axios.post(
      `${DAUTH_BASE_URL}/api/oauth/token`,
      tokenRequestBody.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { token, access_token } = tokenResponse.data || {};
    const dauthAccessToken = token || access_token;

    if (!dauthAccessToken) {
      return res.status(502).send("DAuth did not return an access token.");
    }

    callbackStep = "resource";
    const userinfoResponse = await axios.post(
      `${DAUTH_BASE_URL}/api/resources/user`,
      {},
      { headers: { Authorization: `Bearer ${dauthAccessToken}` } },
    );

    const dauthUser = userinfoResponse.data;
    const dauthId = getDauthUserValue(dauthUser, ["id", "_id", "sub", "rollNumber", "roll"]);
    const email =
      getDauthUserValue(dauthUser, ["email", "emailAddress"]) ||
      `${dauthId || crypto.randomBytes(8).toString("hex")}@dauth.local`;
    const displayName = getDauthUserValue(dauthUser, [
      "name",
      "username",
      "displayName",
      "firstName",
      "rollNumber",
      "roll",
    ]);

    callbackStep = "local-user";
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username: await buildUniqueUsername(displayName, email),
        email,
        authProvider: "dauth",
        role: "user",
        isPro: false,
        strikes: 0,
      });
      await user.save();
    }

    const appToken = signAppToken(user);
    res.redirect(buildFrontendAuthRedirect(appToken, user, "DAuth"));
  } catch (error) {
    const message = getDauthErrorMessage(error);
    console.error(`DAuth ${callbackStep} failure:`, message);
    res
      .status(500)
      .send(`DAuth authentication failed during ${callbackStep}: ${message}`);
  }
});

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
        redirect_uri: GOOGLE_CALLBACK_URL,
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
      // Create a new hacker-ready user profile with no manual password required
      user = new User({
        username: await buildUniqueUsername(name, email),
        email: email,
        authProvider: "google",
        role: "user",
        isPro: false,
        strikes: 0,
      });
      await user.save();
    }

    // 4. Sign our own native application JWT token
    const token = signAppToken(user);

    // 5. Send the token back to the frontend browser by redirecting with URL parameters
    // This completes the loop and lets the React client extract the token securely.
    res.redirect(buildFrontendAuthRedirect(token, user, "Google"));
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
