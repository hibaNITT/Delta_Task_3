import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  // Pulling the active user profile data and the logout method from our context cloud
  const { user, logout } = useContext(AuthContext);

  return (
    <nav
      style={{
        padding: "15px",
        backgroundColor: "#111",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2 style={{ margin: 0, color: "#ff0000" }}>DTube</h2>
      <div>
        {user ? (
          // Dynamic conditional UI block: If a user state is active, display greeting and a logout button
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span>
              Welcome, <strong>{user.username}</strong> ({user.role})
            </span>
            <button
              onClick={logout}
              style={{
                padding: "5px 10px",
                backgroundColor: "#e50914",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          // If no active user profile exists in memory, display fallback links
          <span>Not Signed In</span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
