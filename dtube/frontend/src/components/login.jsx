import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  //Local state to track what the user types into inputs
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

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
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
    </div>
  );
};

export default Login;

// noww login form can successfully fetch a JWT and save it globally
