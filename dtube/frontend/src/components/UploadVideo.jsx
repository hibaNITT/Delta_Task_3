// THIS IS THE UPLOAD VIDEO FORM

import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const UploadVideo = () => {
  const { token } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [isPremier, setIsPremier] = useState(false);
  const [premierTime, setPremierTime] = useState("");
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setMessage("Please select a video file first.");
      return;
    }

    // Must use FormData since we are shipping a binary media file
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", videoFile);
    formData.append("isPremier", isPremier);
    formData.append("premierTime", isPremier ? premierTime : "");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/videos/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setMessage(response.data.message);
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setIsPremier(false);
      setPremierTime("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Error occurred during upload.",
      );
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto" }}>
      <h2>Upload a New Video</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleUpload}>
        <div>
          <label>Video Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Select Video File:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
        </div>

        {/* Live Premier Scheduling Controls */}
        <div style={{ marginTop: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="isPremier"
            checked={isPremier}
            onChange={(e) => setIsPremier(e.target.checked)}
          />
          <label htmlFor="isPremier" style={{ fontWeight: "bold", cursor: "pointer" }}>
            Schedule as Live Premier
          </label>
        </div>

        {isPremier && (
          <div style={{ marginTop: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Premier Date & Time:</label>
            <input
              type="datetime-local"
              value={premierTime}
              onChange={(e) => setPremierTime(e.target.value)}
              required
            />
          </div>
        )}

        <button type="submit" style={{ marginTop: "20px", display: "block", width: "100%" }}>
          Upload Video
        </button>
      </form>
    </div>
  );
};

export default UploadVideo;
