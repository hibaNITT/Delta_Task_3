import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Navbar from "./components/Navbar";

const MainDashboard = () => {
  const { login, token } = useContext(AuthContext);

  // Health check state
  const [healthStatus, setHealthStatus] = useState("Connecting to backend...");

  // Form states
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Status feedback messages
  const [signupStatus, setSignupStatus] = useState({
    message: "",
    isError: false,
  });
  const [loginStatus, setLoginStatus] = useState({
    message: "",
    isError: false,
  });

  // 1. Check Backend Engine Health on boot
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/health")
      .then((response) => setHealthStatus(response.data.status))
      .catch((error) => {
        console.error("Error fetching health status:", error);
        setHealthStatus("Failed to connect to backend engine.");
      });
  }, []);

  // Form Input Change Handlers
  const handleSignupChange = (e) =>
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  // Submit Handler: Sign Up Registration
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupStatus({ message: "", isError: false });
    try {
      await axios.post("http://localhost:5000/api/auth/signup", signupData);
      setSignupStatus({
        message: "Account created successfully! Proceed to sign in.",
        isError: false,
      });
      setSignupData({ username: "", email: "", password: "" });
    } catch (err) {
      setSignupStatus({
        message: err.response?.data?.message || "Signup failed.",
        isError: true,
      });
    }
  };

  // Submit Handler: Account Sign In
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus({ message: "", isError: false });
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        loginData,
      );
      // Expected backend response signature: { token, user: { username, role } }
      login(res.data.user, res.data.token);
      setLoginStatus({ message: "Welcome back!", isError: false });
      setLoginData({ email: "", password: "" });
    } catch (err) {
      setLoginStatus({
        message: err.response?.data?.message || "Invalid credentials.",
        isError: true,
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        minHeight: "100vh",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {/* Our Global Navbar Top Banner Layout */}
      <Navbar />

      {/* Backend Engine Health Strip */}
      <div
        style={{
          textAlign: "center",
          padding: "15px 0",
          backgroundColor: "#222",
          borderBottom: "1px solid #333",
        }}
      >
        <span>Backend Status: </span>
        <strong
          style={{ color: healthStatus === "ok" ? "#4caf50" : "#f44336" }}
        >
          {healthStatus}
        </strong>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          padding: "40px",
          justifyContent: "center",
        }}
      >
        {/* SIGNUP BOX */}
        <div
          style={{
            backgroundColor: "#252525",
            padding: "30px",
            borderRadius: "6px",
            width: "320px",
            border: "1px solid #333",
          }}
        >
          <h3
            style={{
              margin: "0 0 15px 0",
              color: "#ff0000",
              borderBottom: "1px solid #333",
              paddingBottom: "10px",
            }}
          >
            Create Account
          </h3>
          {signupStatus.message && (
            <p
              style={{
                color: signupStatus.isError ? "#f44336" : "#4caf50",
                fontSize: "14px",
              }}
            >
              {signupStatus.message}
            </p>
          )}
          <form
            onSubmit={handleSignupSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={signupData.username}
              onChange={handleSignupChange}
              required
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #444",
                backgroundColor: "#111",
                color: "#fff",
              }}
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={signupData.email}
              onChange={handleSignupChange}
              required
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #444",
                backgroundColor: "#111",
                color: "#fff",
              }}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={signupData.password}
              onChange={handleSignupChange}
              required
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #444",
                backgroundColor: "#111",
                color: "#fff",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px",
                backgroundColor: "#ff0000",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Sign Up
            </button>
          </form>
        </div>

        {/* LOGIN BOX */}
        <div
          style={{
            backgroundColor: "#252525",
            padding: "30px",
            borderRadius: "6px",
            width: "320px",
            border: "1px solid #333",
          }}
        >
          <h3
            style={{
              margin: "0 0 15px 0",
              color: "#4caf50",
              borderBottom: "1px solid #333",
              paddingBottom: "10px",
            }}
          >
            Sign In
          </h3>
          {loginStatus.message && (
            <p
              style={{
                color: loginStatus.isError ? "#f44336" : "#4caf50",
                fontSize: "14px",
              }}
            >
              {loginStatus.message}
            </p>
          )}
          <form
            onSubmit={handleLoginSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={loginData.email}
              onChange={handleLoginChange}
              required
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #444",
                backgroundColor: "#111",
                color: "#fff",
              }}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #444",
                backgroundColor: "#111",
                color: "#fff",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px",
                backgroundColor: "#4caf50",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Root layout wrapped carefully inside the Provider context cloud
export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
