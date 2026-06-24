import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
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
    <div className="video-detail-container">
      {/* Video Player */}
      <div className="video-player-wrapper">
        <video
          src={`http://localhost:5000/uploads/${video.videoUrl.split("/").pop()}`}
          crossOrigin="anonymous"
          controls
          autoPlay
          style={{ width: "100%", maxHeight: "550px", display: "block" }}
        />
      </div>

      {/* Video Title and Engagement row */}
      <h2>{video.title}</h2>
      <div className="flex-row-space-between">
        <span className="video-meta-text">
          {video.views || 0} views •{" "}
          {new Date(video.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={handleLikeToggle}
          className={`like-btn ${isLiked ? "active" : "inactive"}`}
        >
          {isLiked ? "👍 Liked" : "👍 Like"} ({likeCount})
        </button>
      </div>

      {/* Channel Information Profile row */}
      <div
        className="flex-row-space-between"
        style={{
          marginTop: "20px",
          borderTop: "1px solid #eee",
          paddingTop: "10px",
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 5px 0" }}>
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
      <div
        className="description-box"
        style={{
          marginTop: "15px",
          padding: "15px",
          backgroundColor: "#f9f9f9",
          borderRadius: "5px",
        }}
      >
        <p>{video.description || "No description provided."}</p>
      </div>

      {/* Comments Section */}
      <div className="comments-section" style={{ marginTop: "30px" }}>
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
        <div className="comment-stack" style={{ marginTop: "20px" }}>
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="comment-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #f1f1f1",
              }}
            >
              <div>
                <strong className="comment-author">
                  @{comment.uploader?.username || "User"}
                </strong>
                <p className="comment-text" style={{ margin: "5px 0 0 0" }}>
                  {comment.text}
                </p>
              </div>

              {/* Show delete action only if user is author or an admin */}
              {user &&
                (comment.uploader?._id === (user.userId || user._id) ||
                  user.role === "admin") && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="comment-delete-btn"
                    style={{
                      background: "none",
                      border: "none",
                      color: "red",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                )}
            </div>
          ))}

          {comments.length === 0 && (
            <p
              className="placeholder-text"
              style={{ color: "#888", fontStyle: "italic", marginTop: "15px" }}
            >
              No comments posted yet. Be the first!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
