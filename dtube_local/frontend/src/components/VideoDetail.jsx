import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import FlagCommentModal from "./FlagCommentModal";
import FlagVideoModal from "./FlagVideoModal";
import "../App.css";

const VideoDetail = () => {
  // Get video ID from URL and login info from global Context
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);

  // Component states
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Live Chat and Premier Countdown States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [ws, setWs] = useState(null);
  const [isPremierFuture, setIsPremierFuture] = useState(false);
  const [countdownText, setCountdownText] = useState("");

  // Flag modal states
  const [showFlagCommentModal, setShowFlagCommentModal] = useState(false);
  const [showFlagVideoModal, setShowFlagVideoModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [flaggedComments, setFlaggedComments] = useState(new Set());
  const [flaggedVideo, setFlaggedVideo] = useState(false);

  // Headers config for secure API requests
  const apiConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch video data, likes status, comments, and channel info on page load
  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);

        // Fetch video metadata
        const videoResponse = await axios.get(
          `http://localhost:5000/api/videos/${id}`,
        );
        const videoData = videoResponse.data;
        setVideo(videoData);
        setLikeCount(videoData.likes?.length || 0);

        // Check if the logged-in user liked this video
        if (user && videoData.likes) {
          const currentUserId = user.userId || user._id;
          setIsLiked(videoData.likes.includes(currentUserId));
        }

        //Fetch video comments
        const commentsResponse = await axios.get(
          `http://localhost:5000/api/videos/${id}/comments`,
        );
        setComments(commentsResponse.data);

        // Fetch creator profile for subscriber tracking
        if (videoData.uploader?._id) {
          try {
            const channelResponse = await axios.get(
              `http://localhost:5000/api/users/${videoData.uploader._id}`,
            );
            setSubCount(channelResponse.data.subscribers?.length || 0);

            // Check if user is already subscribed
            if (user && channelResponse.data.subscribers) {
              const currentUserId = user.userId || user._id;
              setIsSubscribed(
                channelResponse.data.subscribers.includes(currentUserId),
              );
            }
          } catch (userErr) {
            console.warn(
              "User profile route /api/users/:id returned a 404. Bypassing safely:",
              userErr,
            );
            // Safe fallback defaults so the rest of the layout loads fine
            setSubCount(0);
            setIsSubscribed(false);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading video details:", err);
        setError("Could not load video player details.");
        setLoading(false);
      }
    };

    if (id) {
      fetchVideoData();
    }
  }, [id, user]);

  // 1. Live Chat WebSocket Connection Setup
  useEffect(() => {
    if (!video || !video.isPremier) return;

    // Open connection to WebSocket server
    const socket = new WebSocket("ws://localhost:5000");
    setWs(socket);

    socket.onopen = () => {
      console.log("Connected to Live Chat server");
      // Subscribe to this video's room
      socket.send(JSON.stringify({ type: "join", videoId: id }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "chat") {
          setChatMessages((prev) => [...prev, message]);
        }
      } catch (err) {
        console.error("Error receiving WebSocket message:", err);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from Live Chat server");
    };

    return () => {
      socket.close();
    };
  }, [video, id]);

  // 2. Scheduled Live Premier Countdown Timer
  useEffect(() => {
    if (!video || !video.isPremier || !video.premierTime) {
      setIsPremierFuture(false);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(video.premierTime);
      const difference = target - now;

      if (difference > 0) {
        setIsPremierFuture(true);
        // Calculate units
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const pad = (num) => String(num).padStart(2, "0");
        setCountdownText(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setIsPremierFuture(false);
      }
    };

    updateCountdown(); // Run immediately
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [video]);

  // Handle sending a chat message to the WebSocket server
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!token) return alert("Please log in to chat!");
    if (!ws) return alert("Chat server connection is not active.");

    const payload = {
      type: "message",
      videoId: id,
      text: chatInput,
      token: token,
    };

    ws.send(JSON.stringify(payload));
    setChatInput("");
  };

  // Toggle Like button handler
  const handleLikeToggle = async () => {
    if (!token) return alert("Please log in to like videos!");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/videos/${id}/like`,
        {},
        apiConfig,
      );

      if (response.data.liked) {
        setIsLiked(true);
        setLikeCount(likeCount + 1);
      } else {
        setIsLiked(false);
        setLikeCount(likeCount - 1);
      }
    } catch (err) {
      alert("Error processing like action.");
    }
  };

  // Toggle Subscribe button handler (uses backend kronos_helper)
  const handleSubscribeToggle = async () => {
    if (!token) return alert("Please log in to subscribe to channels!");

    const currentUserId = user.userId || user._id;
    if (video.uploader._id === currentUserId) {
      return alert("You cannot subscribe to your own channel.");
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/${video.uploader._id}/subscribe`,
        {},
        apiConfig,
      );

      if (response.data.subscribed) {
        setIsSubscribed(true);
        setSubCount(subCount + 1);
      } else {
        setIsSubscribed(false);
        setSubCount(subCount - 1);
      }
    } catch (err) {
      alert("Error updating subscription status.");
    }
  };

  // Submit form text comment
  const handlePostComment = async (e) => {
    e.preventDefault(); // Stop standard page refresh
    if (!newCommentText.trim()) return;
    if (!token) return alert("Please log in to submit comments!");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/videos/${id}/comments`,
        { text: newCommentText },
        apiConfig,
      );

      // Add the new comment payload instantly to the top of the array list
      setComments([response.data, ...comments]);
      setNewCommentText("");
    } catch (err) {
      alert("Failed to submit comment.");
    }
  };

  // Delete a comment item
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/videos/comments/${commentId}`,
        apiConfig,
      );

      // Instantly remove comment from visual array view using array filter
      setComments(comments.filter((item) => item._id !== commentId));
    } catch (err) {
      alert("Unauthorized or failed to delete comment.");
    }
  };

  // Safe layout guards for asynchronous load states
  if (loading)
    return (
      <div style={{ padding: "20px", fontWeight: "bold" }}>
        Loading DTube Stream...
      </div>
    );
  if (error || !video)
    return (
      <div style={{ padding: "20px", color: "red" }}>
        {error || "Video not found."}
      </div>
    );

  return (
    <div
      className="video-detail-container"
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Outer row wrapper holding Player/Countdown (left) and Live Chat (right) */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        {/* Left Side: Video Player or Countdown Banner */}
        <div style={{ flex: "2", minWidth: "300px" }}>
          <div
            className="video-player-wrapper"
          >
            {isPremierFuture ? (
              // Countdown Display for Future Scheduled Premiere
              <div className="premiere-countdown">
                <h2>Live Premier Countdown</h2>
                <div className="premiere-countdown-timer">
                  {countdownText}
                </div>
                <p className="premiere-countdown-label">
                  Premiering on {new Date(video.premierTime).toLocaleString()}
                </p>
              </div>
            ) : (
              // Standard Video Player revealed once countdown hits zero
              <video
                src={`http://localhost:5000/uploads/${video.videoUrl.split("/").pop()}`}
                crossOrigin="anonymous"
                controls
                autoPlay
                className="video-player"
              />
            )}
          </div>
        </div>

        {/* Right Side: Live Chat Sidebar (Only visible for Premiere videos) */}
        {video.isPremier && (
          <div className="live-chat-sidebar">
            {/* Header */}
            <div className="live-chat-header">🔴 LIVE CHAT</div>

            {/* Chat Messages Log */}
            <div className="live-chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className="live-chat-message">
                  <span className="chat-username">@{msg.username}</span>
                  : <span>{msg.text}</span>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="live-chat-empty">
                  Welcome to Live Chat! Say hello...
                </div>
              )}
            </div>

            {/* Inbound Input Form controls */}
            <div className="live-chat-footer">
              {token ? (
                <form
                  onSubmit={handleSendChatMessage}
                  style={{ display: "flex", gap: "5px" }}
                >
                  <input
                    type="text"
                    placeholder="Chat..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{
                      flex: "1",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #444",
                      backgroundColor: "#333",
                      color: "#fff",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#e50914",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Send
                  </button>
                </form>
              ) : (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#aaa",
                    textAlign: "center",
                  }}
                >
                  Please{" "}
                  <Link to="/auth" style={{ color: "#4285F4" }}>
                    login
                  </Link>{" "}
                  to participate in Live Chat.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Title and Engagement row */}
      <h2>{video.title}</h2>
      <div className="video-engagement-row">
        <span className="video-meta-text">
          {video.views || 0} views •{" "}
          {new Date(video.createdAt).toLocaleDateString()}
        </span>
        <div className="engagement-buttons">
          <button
            onClick={handleLikeToggle}
            className={`like-btn ${isLiked ? "active" : "inactive"}`}
          >
            {isLiked ? "👍 Liked" : "👍 Like"} ({likeCount})
          </button>
          {token && (
            <button
              onClick={() => setShowFlagVideoModal(true)}
              className="flag-video-btn"
              disabled={flaggedVideo}
            >
              {flaggedVideo ? "✓ Reported" : "🚩 Report Video"}
            </button>
          )}
        </div>
      </div>

      {/* Channel Information Profile row */}
      <div className="channel-info-row">
        <div>
          <h4 className="channel-name">
            Channel: {video.uploader?.username || "Unknown Creator"}
          </h4>
          <span className="placeholder-text">{subCount} subscribers</span>
        </div>

        {/* Show Subscribe button only if visiting another user's channel video */}
        {user && video.uploader?._id !== (user.userId || user._id) && (
          <button
            onClick={handleSubscribeToggle}
            className={`subscribe-btn ${isSubscribed ? "active" : "inactive"}`}
          >
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </button>
        )}
      </div>

      {/* Description Box */}
      <div className="description-box">
        <p>{video.description || "No description provided."}</p>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h3>Comments ({comments.length})</h3>

        {/* Comment input form display wrapper toggled by user authentication state */}
        {token ? (
          <form onSubmit={handlePostComment} className="comment-form">
            <input
              type="text"
              placeholder="Add a public comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="comment-input"
            />
            <button type="submit" className="comment-submit-btn">
              Post
            </button>
          </form>
        ) : (
          <p className="placeholder-text">
            Please <Link to="/login">login</Link> to add your input or interact
            with this video.
          </p>
        )}

        {/* Comments Stream Feed lists mapping loop */}
        <div className="comment-stack">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="comment-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong className="comment-author">
                  @{comment.uploader?.username || "User"}
                </strong>
                <p className="comment-text">{comment.text}</p>
              </div>

              {/* Show delete and flag actions */}
              <div className="comment-actions">
                {user &&
                  (comment.uploader?._id === (user.userId || user._id) ||
                    user.role === "admin") && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="comment-delete-btn"
                    >
                      Delete
                    </button>
                  )}
                {token && !flaggedComments.has(comment._id) && (
                  <button
                    onClick={() => {
                      setSelectedCommentId(comment._id);
                      setShowFlagCommentModal(true);
                    }}
                    className="comment-flag-btn"
                  >
                    🚩 Flag
                  </button>
                )}
                {flaggedComments.has(comment._id) && (
                  <span className="comment-flagged-badge">✓ Flagged</span>
                )}
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="placeholder-text">
              No comments posted yet. Be the first!
            </p>
          )}
        </div>
      </div>

      {/* Flag Modals */}
      {showFlagCommentModal && selectedCommentId && (
        <FlagCommentModal
          commentId={selectedCommentId}
          onClose={() => {
            setShowFlagCommentModal(false);
            setSelectedCommentId(null);
          }}
          onSuccess={() => {
            alert("Comment reported successfully");
            setFlaggedComments(
              new Set([...flaggedComments, selectedCommentId]),
            );
            setShowFlagCommentModal(false);
            setSelectedCommentId(null);
          }}
        />
      )}

      {showFlagVideoModal && (
        <FlagVideoModal
          videoId={id}
          onClose={() => setShowFlagVideoModal(false)}
          onSuccess={() => {
            alert("Video reported successfully");
            setFlaggedVideo(true);
            setShowFlagVideoModal(false);
          }}
        />
      )}
    </div>
  );
};

export default VideoDetail;
