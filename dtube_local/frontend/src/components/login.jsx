import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

import { useNavigate, useLocation } from "react-router-dom";

const Login = () => {
  // Local state to track what the user types into inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Pull the global login helper function out of our context cloud
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the browser from reloading the entire page
    setError("");

    try {
      // Send the credentials directly to the active backend API endpoint we verified
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
      );

      // If backend accepts it, call the context helper to save token and user globally
      login(response.data.user, response.data.token);
      alert("Logged in successfully!");
    } catch (err) {
      // If credentials match nothing, show the error message returned by your backend
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const GOOGLE_CLIENT_ID =
    "670552438880-fcohrrjnrl6kp7eln3j9tbdnnqo8jmgd.apps.googleusercontent.com";
  const REDIRECT_URI = "http://localhost:5000/api/auth/google/callback";
  const SCOPE = "profile email";

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}`;

  return (
    <div
      style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}
    >
      <h2>Login to DTube</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <br />
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <br />
        <button type="submit">Login</button>
      </form>

      <hr style={{ margin: "1.5rem 0" }} />

      <div
        className="oauth-divider"
        style={{ margin: "20px 0", textAlign: "center" }}
      >
        <span>OR</span>
      </div>

      <div
        className="oauth-buttons-container"
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        {/* Hand-rolled Sign in with Google anchor button */}
        <a
          href={googleAuthUrl}
          className="google-signin-btn"
          style={{
            display: "block",
            textAlign: "center",
            padding: "10px",
            backgroundColor: "#4285F4",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
};

export default Login;

// noww login form can successfully fetch a JWT and save it globally
