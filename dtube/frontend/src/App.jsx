import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [healthStatus, setHealthStatus] = useState("Connecting to backend...");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/health")
      .then((response) => {
        // If successful, saving the status text to our state
        setHealthStatus(response.data.status);
      })
      .catch((error) => {
        console.error("Error fetching health status:", error);
        setHealthStatus("Failed to connect to backend engine.");
      });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "sans-serif",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
      }}
    >
      <h1>DTube Workspace</h1>
      <p>
        Backend Engine Status:{" "}
        <strong
          style={{ color: healthStatus === "ok" ? "#4caf50" : "#f44336" }}
        >
          {healthStatus}
        </strong>
      </p>
    </div>
  );
}

export default App;
