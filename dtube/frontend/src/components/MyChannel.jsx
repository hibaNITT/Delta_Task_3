import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../App.css";

const MyChannel = () => {
  const { user, token, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Video Modal/State
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPremier, setEditIsPremier] = useState(false);
  const [editPremierTime, setEditPremierTime] = useState("");
  const [editSuccessMsg, setEditSuccessMsg] = useState("");
  const [editErrorMsg, setEditErrorMsg] = useState("");

  const apiConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchChannelData = () => {
    if (!user || !user.username) return;
    setLoading(true);
    setError("");

    axios
      .get(`https://dtube-api-2.onrender.com/api/videos/profile/${user.username}`)
      .then((res) => {
        setChannelData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading channel data:", err);
        setError(
          err.response?.data?.message || "Could not retrieve your channel details.",
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchChannelData();
  }, [user]);

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to permanently delete this video?")) {
      return;
    }

    try {
      await axios.delete(`https://dtube-api-2.onrender.com/api/videos/${videoId}`, apiConfig);
      alert("Video deleted successfully.");
      // Refresh local state list
      setChannelData((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v._id !== videoId),
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete video.");
    }
  };

  const startEdit = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
    setEditIsPremier(video.isPremier || false);
    setEditPremierTime(
      video.premierTime ? new Date(video.premierTime).toISOString().slice(0, 16) : "",
    );
    setEditSuccessMsg("");
    setEditErrorMsg("");
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!editingVideo) return;

    try {
      const response = await axios.put(
        `https://dtube-api-2.onrender.com/api/videos/${editingVideo._id}`,
        {
          title: editTitle,
          description: editDescription,
          isPremier: editIsPremier,
          premierTime: editIsPremier ? editPremierTime : null,
        },
        apiConfig,
      );

      setEditSuccessMsg("Video updated successfully!");
      
      // Update local state list
      setChannelData((prev) => ({
        ...prev,
        videos: prev.videos.map((v) =>
          v._id === editingVideo._id ? response.data.video : v,
        ),
      }));

      setTimeout(() => {
        setEditingVideo(null);
      }, 1000);
    } catch (err) {
      setEditErrorMsg(err.response?.data?.message || "Failed to update video.");
    }
  };

  const handleDisablePro = async () => {
    if (
      !window.confirm(
        "Are you sure you want to deactivate your DTube Pro Subscription? Banner ads will be re-enabled.",
      )
    ) {
      return;
    }

    try {
      const res = await axios.post(
        "https://dtube-api-2.onrender.com/api/auth/pro/unsubscribe",
        {},
        apiConfig,
      );
      updateUser(res.data.user);

      // Update local state profile too
      setChannelData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          isPro: false,
        },
      }));

      alert("DTube Pro has been successfully deactivated.");
    } catch (err) {
      alert(err.response?.data?.message || "Could not deactivate DTube Pro.");
    }
  };

  const handleActivatePro = async () => {
    try {
      const res = await axios.post(
        "https://dtube-api-2.onrender.com/api/auth/pro/subscribe",
        {},
        apiConfig,
      );
      updateUser(res.data.user);

      // Update local state profile too
      setChannelData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          isPro: true,
        },
      }));

      alert("DTube Pro activated. Ads are now hidden.");
    } catch (err) {
      alert(err.response?.data?.message || "Could not activate DTube Pro.");
    }
  };

  if (!user) {
    return (
      <div className="channel-container" style={{ textAlign: "center", padding: "40px" }}>
        <h2>My Creator Channel</h2>
        <p className="placeholder-text">Please sign in to manage your creator channel and uploads.</p>
        <Link to="/auth" className="comment-signin-btn" style={{ marginTop: "20px" }}>
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="status-message">
        Syncing channel telemetry statistics...
      </div>
    );
  }

  if (error) return <div className="error-message">{error}</div>;
  if (!channelData)
    return <div className="status-message">No channel details found.</div>;

  const { profile, videos } = channelData;

  return (
    <div className="channel-container">
      {/* Channel Header Banner Area */}
      <div className="channel-banner">
        <h1 className="channel-title">@{profile.username} (My Channel)</h1>
        <div className="channel-metrics">
          <span>
            Subscribers: <strong>{profile.subscribersCount}</strong>
          </span>
          <span>
            Total Uploads: <strong>{videos.length} clips</strong>
          </span>
          {profile.isPro && <span className="pro-badge">PRO MEMBER</span>}
        </div>
        
        <div style={{ marginTop: "16px" }}>
          {profile.isPro ? (
            <button
              onClick={handleDisablePro}
              className="comment-delete-btn"
              style={{
                padding: "6px 12px",
                border: "1px solid var(--p-cream)",
                color: "var(--p-cream)",
                background: "transparent",
                borderRadius: "var(--radius-full)",
                cursor: "pointer"
              }}
            >
              Disable Pro Membership
            </button>
          ) : (
            <button
              onClick={handleActivatePro}
              className="comment-signin-btn"
              style={{
                padding: "6px 12px",
                background: "var(--p-cream)",
                color: "var(--accent-text)",
                border: "none",
                cursor: "pointer"
              }}
            >
              Go Pro
            </button>
          )}
        </div>
      </div>

      {/* Creator Video Catalog Section Grid */}
      <h2>Manage Uploaded Content</h2>
      {videos.length === 0 ? (
        <div className="placeholder-text" style={{ padding: "40px 0" }}>
          <p>You haven't uploaded any videos yet.</p>
          <Link to="/upload" className="comment-signin-btn" style={{ marginTop: "16px" }}>
            Upload First Video
          </Link>
        </div>
      ) : (
        <div className="video-catalog-grid">
          {videos.map((vid) => (
            <div key={vid._id} className="video-card">
              {/* Video Player Preview Block */}
              <div className="video-thumbnail-placeholder" style={{ position: "relative" }}>
                📺 Video Player Preview
                {vid.isPremier && (
                  <span className="pro-badge" style={{ position: "absolute", top: "8px", right: "8px", background: "var(--danger)" }}>
                    PREMIERE
                  </span>
                )}
              </div>

              <div className="video-card-body">
                <h4 className="video-card-title">
                  <Link to={`/videos/${vid._id}`} className="video-card-link">
                    {vid.title}
                  </Link>
                </h4>
                <p className="video-card-views">{vid.viewCount || 0} views</p>
                
                {/* Actions row */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={() => startEdit(vid)}
                    className="comment-signin-btn"
                    style={{ padding: "6px 12px", fontSize: "0.8rem", backgroundColor: "var(--accent)" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(vid._id)}
                    className="comment-delete-btn"
                    style={{ padding: "6px 12px", fontSize: "0.8rem", border: "1px solid var(--danger)", borderRadius: "var(--radius-full)" }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Video Modal Backdrop */}
      {editingVideo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="auth-box"
            style={{
              width: "480px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h3 className="auth-box-header" style={{ color: "var(--accent)" }}>
              Edit Video Metadata
            </h3>
            
            {editSuccessMsg && (
              <p className="status-message success" style={{ marginBottom: "16px" }}>
                {editSuccessMsg}
              </p>
            )}
            {editErrorMsg && (
              <p className="status-message error" style={{ marginBottom: "16px" }}>
                {editErrorMsg}
              </p>
            )}

            <form onSubmit={handleUpdateVideo} className="auth-box-form">
              <div className="form-group">
                <label className="form-label">Video Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="auth-box-input"
                />
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label className="form-label">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="auth-box-input"
                  style={{ minHeight: "80px", resize: "vertical" }}
                />
              </div>

              <div className="form-group" style={{ marginTop: "12px", flexDirection: "row", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="editIsPremier"
                  checked={editIsPremier}
                  onChange={(e) => setEditIsPremier(e.target.checked)}
                />
                <label htmlFor="editIsPremier" className="form-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                  Schedule as Premiere
                </label>
              </div>

              {editIsPremier && (
                <div className="form-group" style={{ marginTop: "12px" }}>
                  <label className="form-label">Premiere Start Time</label>
                  <input
                    type="datetime-local"
                    value={editPremierTime}
                    onChange={(e) => setEditPremierTime(e.target.value)}
                    required
                    className="auth-box-input"
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button type="submit" className="comment-signin-btn" style={{ flex: 1 }}>
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="comment-delete-btn"
                  style={{ flex: 1, border: "1px solid var(--border)", borderRadius: "var(--radius-full)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyChannel;
