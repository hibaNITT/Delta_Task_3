// our backend endpoint GET /api/videos/public-feed returns the custom auroraVideoIndex linked list
// instead of a flat array, our React component must loop through the node pointers (.next) to build a UI-renderable collection.

import React, { useEffect, useState } from "react";
import axios from "axios";

import { Link } from "react-router-dom";

const VideoFeed = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/videos/public-feed",
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
    <div style={{ padding: "20px" }}>
      <h2>DTube Public Feed</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        className="video-feed-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
          padding: "20px",
        }}
      >
        {videos.map((video) => (
          <Link
            to={`/videos/${video._id}`}
            key={video._id}
            className="video-card-link"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              className="video-card"
              style={{
                cursor: "pointer",
                backgroundColor: "#1e1e1e",
                borderRadius: "8px",
                overflow: "hidden",
                padding: "10px",
              }}
            >
              {/* Thumbnail fallback block */}
              <div
                style={{
                  width: "100%",
                  height: "150px",
                  backgroundColor: "#333",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#aaa" }}>🎬 Video Preview</span>
              </div>

              <h3 style={{ margin: "10px 0 5px 0", fontSize: "16px" }}>
                {video.title}
              </h3>
              <p style={{ margin: "0", fontSize: "12px", color: "#aaa" }}>
                By {video.uploader?.username || "Creator"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;
