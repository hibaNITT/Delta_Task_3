// WHY THIS FIEL?

// The AuthContext.js file serves as the global security hub for your React application.
// Its primary responsibility is to store and share authentication details (like who is logged in and what their security token is)
// with any component that needs it, without forcing you to pass data manually down through long chains of nested components.

// you don't have to rewrite verification systems on every single new page component you build. You write it once,
//  and the state handles itself globally.

import React, { createContext, useState, useEffect } from "react";

// Create the Context data cloud
// This initializes a blank space in React's memory to hold global data.
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  //   what is Rehydration:
  // The process of restoring an application's state
  //   in memory from a persistent storage location (like the browser's hard drive) after a page refresh.

  //   React's normal memory state resets to null the exact millisecond a user hits refresh or reloads the browser tab.
  //   By adding this useEffect (which runs automatically when the app boots up), we check if a passport (token) was saved
  //   in the browser's persistent localStorage. If it finds it, it automatically injects it back into React's active memory
  //   so the user doesn't get annoying logs outs every time they hit refresh.

  //  Check if user logged in previously when page refreshes
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);

      //   JSON.parse(): Converts a text string back into a readable JavaScript object.
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function to update state globally
  const login = (userData, userToken) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem("token", userToken);

    // JSON.stringify(): The opposite of parse. It takes a structural
    // JavaScript object and squishes it into a flat text string because localStorage can only save plain text.

    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Logout function to clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
