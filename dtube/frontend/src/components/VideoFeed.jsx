// our backend endpoint GET /api/videos/public-feed returns the custom auroraVideoIndex linked list
// instead of a flat array, our React component must loop through the node pointers (.next) to build a UI-renderable collection.

import React, { useEffect, useState } from "react";
import axios from "axios";

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
          if (headNode.data) {
            flatArray.push(headNode.data);
          }
          headNode = headNode.next;
        }

        setVideos(flatArray);
      } catch (err) {
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
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {videos.map((video) => (
          <div
            key={video._id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "5px",
            }}
          >
            <h3>{video.title}</h3>
            <p>{video.description}</p>
            <p>
              <small>
                Uploaded by: {video.uploader?.username || "Unknown User"}
              </small>
            </p>

            {/* Standard native HTML5 player linking directly to your backend static serving route */}
            <video width="100%" controls>
              <source
                src={`http://localhost:5000${video.videoUrl}`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;
