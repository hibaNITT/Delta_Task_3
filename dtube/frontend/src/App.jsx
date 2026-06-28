import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import "./App.css";

// for video features
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import VideoFeed from "./components/VideoFeed";
import UploadVideo from "./components/UploadVideo";
import VideoDetail from "./components/VideoDetail";

import Login from "./components/login";
import SignUp from "./components/signUp";

import CategoryTreeMap from "./components/CategoryTreeMap";

import CreatorChannel from "./components/CreatorChannel";

import Trending from "./components/Trending";

//login and signup forms
const AuthPage = ({
  signupData,
  handleSignupChange,
  handleSignupSubmit,
  signupStatus,
  loginData,
  handleLoginChange,
  handleLoginSubmit,
  loginStatus,
}) => {
  return (
    <div className="auth-page-wrapper">
      {/* SIGNUP BOX */}
      <div className="auth-box">
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
            className="status-message"
            style={{ color: signupStatus.isError ? "#f44336" : "#4caf50" }}
          >
            {signupStatus.message}
          </p>
        )}
        <form onSubmit={handleSignupSubmit} className="auth-box-form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={signupData.username}
            onChange={handleSignupChange}
            required
            className="auth-box-input"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={signupData.email}
            onChange={handleSignupChange}
            required
            className="auth-box-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={signupData.password}
            onChange={handleSignupChange}
            required
            className="auth-box-input"
          />
          <button type="submit" className="btn-signup">
            Sign Up
          </button>
        </form>
      </div>

      {/* LOGIN BOX */}
      <div className="auth-box">
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
            className="status-message"
            style={{ color: loginStatus.isError ? "#f44336" : "#4caf50" }}
          >
            {loginStatus.message}
          </p>
        )}
        <form onSubmit={handleLoginSubmit} className="auth-box-form">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={loginData.email}
            onChange={handleLoginChange}
            required
            className="auth-box-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={handleLoginChange}
            required
            className="auth-box-input"
          />
          <button type="submit" className="btn-login">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

const MainDashboard = () => {
  const { login, token } = useContext(AuthContext);
  const [healthStatus, setHealthStatus] = useState("Connecting to backend...");

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  const [signupStatus, setSignupStatus] = useState({
    message: "",
    isError: false,
  });
  const [loginStatus, setLoginStatus] = useState({
    message: "",
    isError: false,
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/health")
      .then((response) => setHealthStatus(response.data.status))
      .catch((error) => {
        console.error("Error fetching health status:", error);
        setHealthStatus("Failed to connect to backend engine.");
      });
  }, []);

  const handleSignupChange = (e) =>
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus({ message: "", isError: false });
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        loginData,
      );
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
    <Router>
      <div className="app-container">
        <Navbar />

        {/* Navigation context panel */}
        <div className="nav-context-bar">
          <Link to="/" className="nav-link">
            Home Feed
          </Link>
          <Link to="/upload" className="nav-link">
            Upload Video
          </Link>
          <Link to="/auth" className="nav-link">
            Account
          </Link>
          <Link to="/admin" className="nav-link">
            Admin Metrics
          </Link>
        </div>

        {/* System status display indicator strip */}
        <div className="health-strip">
          <span>Backend Status: </span>
          <strong
            style={{ color: healthStatus === "ok" ? "#4caf50" : "#f44336" }}
          >
            {healthStatus}
          </strong>
        </div>

        <Routes>
          <Route path="/" element={<VideoFeed />} />
          <Route path="/upload" element={<UploadVideo />} />
          <Route
            path="/auth"
            element={
              <AuthPage
                signupData={signupData}
                handleSignupChange={handleSignupChange}
                handleSignupSubmit={handleSignupSubmit}
                signupStatus={signupStatus}
                loginData={loginData}
                handleLoginChange={handleLoginChange}
                handleLoginSubmit={handleLoginSubmit}
                loginStatus={loginStatus}
              />
            }
          />

          {/* FIXED: Direct, clean component injection */}
          <Route path="/videos/:id" element={<VideoDetail />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<CategoryTreeMap />} />
          <Route path="/user/:username" element={<CreatorChannel />} />

          <Route path="/trending" element={<Trending />} />
        </Routes>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
