import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../App.css"; // Make sure to import your style file!

const CreatorChannel = () => {
  const { username } = useParams();
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChannel = useCallback(() => {
    if (!username || username === "undefined") {
      setError("Invalid channel username.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    axios
      .get(`http://localhost:5000/api/videos/profile/${username}`)
      .then((res) => {
        setChannelData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading channel data:", err);
        setError(
          err.response?.data?.message || "Could not retrieve channel details. The backend may still be waking up — please try again.",
        );
        setLoading(false);
      });
  }, [username]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  if (loading)
    return (
      <div className="status-message">
        Syncing channel telemetry statistics...
      </div>
    );
  if (error) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <div className="error-message">{error}</div>
      <button
        onClick={fetchChannel}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1.5rem",
          background: "#2563EB",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "0.95rem",
        }}
      >
        Retry
      </button>
    </div>
  );
  if (!channelData)
    return <div className="status-message">No channel details found.</div>;

  const { profile, videos } = channelData;

  return (
    <div className="channel-container">
      {/* Channel Header Banner Area */}
      <div className="channel-banner">
        <h1 className="channel-title">@{profile.username}</h1>
        <div className="channel-metrics">
          <span>
            Subscribers: <strong>{profile.subscribersCount}</strong>
          </span>
          <span>
            Total Uploads: <strong>{videos.length} clips</strong>
          </span>
          {profile.isPro && <span className="pro-badge">PRO MEMBER</span>}
        </div>
      </div>

      {/* Creator Video Catalog Section Grid */}
      <h2>Uploaded Content Feed</h2>
      {videos.length === 0 ? (
        <p className="video-card-views">
          This creator hasn't published any videos yet.
        </p>
      ) : (
        <div className="video-catalog-grid">
          {videos.map((vid) => (
            <div key={vid._id} className="video-card">
              {/* Video Player Preview Block */}
              <div className="video-thumbnail-placeholder">
                📺 Video Player Preview
              </div>

              <div className="video-card-body">
                <h4 className="video-card-title">
                  <Link to={`/videos/${vid._id}`} className="video-card-link">
                    {vid.title}
                  </Link>
                </h4>
                <p className="video-card-views">{vid.viewCount || 0} views</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatorChannel;

