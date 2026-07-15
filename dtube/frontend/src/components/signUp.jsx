import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
  // Set up local states to keep track of what the user is typing
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // e.preventDefault():
  // When you click a "submit" button inside a classic HTML form,
  // the web browser's natural default behavior is to reload the entire web page to send the data.
  //  In React, we handle everything behind the scenes using Axios. This line blocks the browser from
  // refreshing so our app stays fast and doesn't lose its current memory.

  // This function runs when the user clicks the "Register" button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the browser from refreshing the page
    setError("");
    setSuccess("");

    try {
      // Make an HTTP POST call directly to your active backend signup API
      const response = await axios.post(
        "https://dtube-api-2.onrender.com/api/auth/signup",
        {
          username,
          email,
          password,
        },
      );

      // If the backend accepts it, show a success message and clear the input boxes
      setSuccess(response.data.message || "User registered successfully!");
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      // If the email is taken or password is weak, show the backend's error message
      setError(
        err.response?.data?.message || "Something went wrong during signup.",
      );
    }
  };

  //this is the form
  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>Create a DTube Account</h2>

      {/* Dynamic Alerts based on what happened */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <br />
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
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Signup;
