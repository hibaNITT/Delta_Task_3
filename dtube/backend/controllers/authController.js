// controller file to manage business logic for registration
// and credential matching. We will use bcryptjs to securely hash incoming passwords and jsonwebtoken to sign tokens

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP CONTROLLER
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash the password - never save plain text
    // salt- : A random string added to the password before hashing.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN CONTROLLER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Signing a JWT using the mandated system environment variable
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.DTUBE_CONSTELLATION_Conspiracy_SECRET,
      { expiresIn: "7d" },
    );

    // Return token and safe user info (never pass the password hash back)
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPro: user.isPro,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
