import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Trending = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/videos/trending")
      .then((res) => {
        setVideos(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading trending feed:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div style={{ padding: "20px" }}>Loading trending clips...</div>;

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>
        🔥 Trending Content (Most Viewed)
      </h2>

      {videos.length === 0 ? (
        <p>No trending videos found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {videos.map((vid) => (
            <div
              key={vid._id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  height: "150px",
                  backgroundColor: "#cbd5e1",
                  borderRadius: "6px",
                  marginBottom: "10px",
                }}
              />
              <h3 style={{ margin: "0 0 6px 0", fontSize: "18px" }}>
                <Link
                  to={`/videos/${vid._id}`}
                  style={{ color: "#2563EB", textDecoration: "none" }}
                >
                  {vid.title}
                </Link>
              </h3>
              <p style={{ margin: "0", color: "#64748B", fontSize: "14px" }}>
                Views: <strong>{vid.viewCount || 0}</strong>
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#64748B",
                  fontSize: "12px",
                }}
              >
                Creator:{" "}
                <Link
                  to={`/user/${vid.uploader?.username}`}
                  style={{ color: "#475569" }}
                >
                  @{vid.uploader?.username || "unknown"}
                </Link>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;
