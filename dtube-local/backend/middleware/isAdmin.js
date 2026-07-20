// SECOND MIDDLEWARE
// (It assumes auth.js has already verified the token and attached the payload data to req.user.)

// Separation of Concerns
// auth.js handles Authentication (answers the question: "Who are you? Are you logged in?").
// isAdmin.js handles Authorization (answers the question: "Are you allowed to do this specific action?").

// This middleware runs AFTER auth.js, so req.user is guaranteed to exist if they are logged in
const isAdmin = (req, res, next) => {
  // Check if the user object exists and if their role is exactly 'admin'
  if (req.user && req.user.role === "admin") {
    //  If they are an admin, let them proceed to the route
    next();
  } else {
    // If they are not an admin, block them with a 403 error
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }
};

module.exports = isAdmin;
