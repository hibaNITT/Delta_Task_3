import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

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
          // If no active user profile exists in memory, display fallback text
          <span className="navbar-guest">Not Signed In</span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
