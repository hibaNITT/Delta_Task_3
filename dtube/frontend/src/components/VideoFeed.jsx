// our backend endpoint GET /api/videos/public-feed returns the custom auroraVideoIndex linked list
// instead of a flat array, our React component must loop through the node pointers (.next) to build a UI-renderable collection.

import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import FlagVideoModal from "./FlagVideoModal";

const VideoFeed = () => {
  const { token } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggedVideoId, setFlaggedVideoId] = useState(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await axios.get(
          "https://dtube-api-2.onrender.com/api/videos/public-feed",
        );

        // Extract the head node of the linked list
        let headNode = response.data.auroraVideoIndex;
        const flatArray = [];

        // Traverse the linked list sequentially
        while (headNode) {
          // Robust checking: find where the video schema fields live
          const videoPayload = headNode.data || headNode.video || headNode;

          // Verify we have a valid identifier before pushing to the grid
          if (videoPayload && (videoPayload._id || videoPayload.id)) {
            // Standardize the ID field just in case
            const normalizedVideo = {
              ...videoPayload,
              _id: videoPayload._id || videoPayload.id,
            };
            flatArray.push(normalizedVideo);
          }

          headNode = headNode.next;
        }

        console.log(
          "Successfully parsed feed linked list into array:",
          flatArray,
        );
        setVideos(flatArray);
      } catch (err) {
        console.error("Feed extraction failed:", err);
        setError("Could not load the platform feed.");
      }
    };

    fetchFeed();
  }, []);

  return (
    <div className="feed-container">
      <h2>DTube Public Feed</h2>
      {error && <p className="feed-error">{error}</p>}

      <div className="video-feed-grid">
        {videos.map((video) => (
          <div key={video._id} className="video-card-wrapper">
            <Link to={`/videos/${video._id}`} className="video-card-link">
              <div className="video-card">
                {/* Thumbnail fallback block */}
                <div className="video-thumbnail">
                  <span>🎬 Video Preview</span>
                </div>

                <h3 className="video-card-title">{video.title}</h3>
                <p className="video-card-creator">
                  By {video.uploader?.username || "Creator"}
                </p>
              </div>
            </Link>
            {token && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setFlaggedVideoId(video._id);
                  setShowFlagModal(true);
                }}
                className="feed-flag-btn"
              >
                🚩
              </button>
            )}
          </div>
        ))}
      </div>

      {showFlagModal && flaggedVideoId && (
        <FlagVideoModal
          videoId={flaggedVideoId}
          onClose={() => {
            setShowFlagModal(false);
            setFlaggedVideoId(null);
          }}
          onSuccess={() => {
            alert("Video reported successfully");
            setShowFlagModal(false);
            setFlaggedVideoId(null);
          }}
        />
      )}
    </div>
  );
};

export default VideoFeed;
