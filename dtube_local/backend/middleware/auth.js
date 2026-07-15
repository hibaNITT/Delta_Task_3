//  FIRST MIDDLEWARE

// Think of middleware as a security guard standing at the door of your routes.
// Before anyone can access a private route (like uploading a video), this middleware stops them,
// checks if they have a valid ID badge (the JWT token), reads who they are, and either lets them
// in or kicks them out.

// What is a Token Payload?
// A JSON Web Token (JWT) is split into three parts separated by dots (.): Header, Payload, and Signature.
// The Payload is the middle part. It is the actual data container of the token. It carries the data
//  (called "claims") about the logged-in user that your backend encoded into the token during the login step.

// What is Axios Interceptor:
// A configuration function in your React app that "intercepts" or catches every single outgoing HTTP request
// right before it leaves the browser. We use it to automatically inject the Authorization: Bearer <token> header into every
// request so you don't have to manually write it every time you fetch data.

const jwt = require("jsonwebtoken");

// This is our middleware function
const auth = (req, res, next) => {
  // Getting the Authorization header from the request
  const authHeader = req.header("Authorization");

  // Check if the header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied." });
  }

  // Extract the actual token string (removing the "Bearer " part)
  const token = authHeader.split(" ")[1];

  // When a user logs in, we put their userId and role inside the token payload.
  // By decoding it and attaching it to req.user, any route that uses this middleware
  // can instantly know exactly which user is making the request without asking them to log in again.

  try {
    // Verify the token using your exact mandatory JWT secret key
    const decoded = jwt.verify(
      token,
      process.env.DTUBE_CONSTELLATION_Conspiracy_SECRET,
    );

    // By default, the Express request object (req) does not have a user property.
    //   In our middleware, we create it dynamically (req.user = decoded).

    // Attach the decoded user information to the request object
    req.user = decoded;

    // Call next() to move on to the actual route logic
    // This is a special function in Express
    next();
  } catch (error) {
    // If token is invalid or expired
    return res.status(401).json({ message: "Token is not valid." });
  }
};

module.exports = auth;
