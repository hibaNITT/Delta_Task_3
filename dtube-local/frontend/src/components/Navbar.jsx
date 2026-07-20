import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  // Pulling the active user profile data and the logout method from our context cloud
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <span className="navbar-brand">DTube</span>

      <div className="navbar-user">
        {user ? (
          // Dynamic conditional UI block: If a user state is active, display greeting and a logout button
          <>
            <span>
              Welcome, <strong>{user.username}</strong> ({user.role})
            </span>
            <button onClick={logout} className="btn-signout">
              Sign Out
            </button>
          </>
        ) : (
          // If no active user profile exists in memory, display fallback text and sign-in button
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="navbar-guest">Not Signed In</span>
            <Link to="/auth" className="btn-signin-nav">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
