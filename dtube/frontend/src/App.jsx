import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import "./App.css";

// for video features
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import VideoFeed from "./components/VideoFeed";
import UploadVideo from "./components/UploadVideo";
import VideoDetail from "./components/VideoDetail";

import SignUp from "./components/signUp";

import CategoryTreeMap from "./components/CategoryTreeMap";
import AdminPanel from "./components/AdminPanel";

import CreatorChannel from "./components/CreatorChannel";

import Trending from "./components/Trending";

const BannerAd = ({ user, token, updateUser }) => {
  if (user?.isPro) return null;

  const activatePro = async () => {
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/pro/subscribe",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      updateUser(res.data.user);
      alert("DTube Pro activated. Ads are now hidden.");
    } catch (err) {
      alert(err.response?.data?.message || "Could not activate DTube Pro.");
    }
  };

  return (
    <div className="banner-ad">
      <span className="banner-ad-label">Ad</span>
      <strong>DTube Pro</strong>
      <span>Watch without banner ads for one month.</span>
      <button type="button" onClick={activatePro}>
        Go Pro
      </button>
    </div>
  );
};

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
        <h3 className="auth-box-header signup">Create Account</h3>
        {signupStatus.message && (
          <p className={`status-message ${signupStatus.isError ? "error" : "success"}`}>
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
        <h3 className="auth-box-header login">Sign In</h3>
        {loginStatus.message && (
          <p className={`status-message ${loginStatus.isError ? "error" : "success"}`}>
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

        <div className="auth-divider">OR</div>

        {/* Hand-rolled Google Sign In button added directly to the account page */}
        <a
          href="https://accounts.google.com/o/oauth2/v2/auth?client_id=670552438880-fcohrrjnrl6kp7eln3j9tbdnnqo8jmgd.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fauth%2Fgoogle%2Fcallback&response_type=code&scope=profile%20email"
          className="google-signin-btn"
        >
          Sign in with Google
        </a>
        <a
          href="http://localhost:5000/api/auth/dauth/start"
          className="dauth-signin-btn"
        >
          Sign in with DAuth
        </a>
      </div>
    </div>
  );
};

const MainDashboard = () => {
  const { login, token, user, updateUser } = useContext(AuthContext);
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
    // Check if we were redirected from an OAuth provider with query parameters.
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      const urlId = params.get("id");
      const urlUsername = params.get("username");
      const urlEmail = params.get("email");
      const urlRole = params.get("role");
      const urlIsPro = params.get("isPro") === "true";
      const provider = params.get("provider") || "OAuth";

      // Reconstruct user object
      const userData = {
        id: urlId,
        username: urlUsername,
        email: urlEmail,
        role: urlRole || "user",
        isPro: urlIsPro,
      };

      // Save user session globally
      login(userData, urlToken);
      alert(`Logged in with ${provider} successfully!`);

      // Hard redirect to home to clear query parameters and prevent loop issues
      window.location.href = "/";
    }

    axios
      .get("http://localhost:5000/api/health")
      .then((response) => setHealthStatus(response.data.status))
      .catch((error) => {
        console.error("Error fetching health status:", error);
        setHealthStatus("Failed to connect to backend engine.");
      });
  }, [login]);

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
          <strong className={healthStatus === "ok" ? "health-ok" : "health-error"}>
            {healthStatus}
          </strong>
        </div>

        <BannerAd user={user} token={token} updateUser={updateUser} />

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

          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<CategoryTreeMap />} />
          <Route path="/admin/reports" element={<AdminPanel />} />
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
