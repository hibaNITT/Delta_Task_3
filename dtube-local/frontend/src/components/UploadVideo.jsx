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
  const [isError, setIsError] = useState(false);

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setMessage("Please select a video file first.");
      setIsError(true);
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
      setIsError(false);
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setIsPremier(false);
      setPremierTime("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Error occurred during upload.",
      );
      setIsError(true);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        {/* Page header */}
        <div className="upload-card-header">
          <h2 className="upload-card-title">Upload a New Video</h2>
          <p className="upload-card-subtitle">
            Fill in the details below and select your video file to publish.
          </p>
        </div>

        {/* Status message */}
        {message && (
          <p className={`upload-status-msg ${isError ? "error" : "success"}`}>
            {isError ? "⚠ " : "✓ "}
            {message}
          </p>
        )}

        <form onSubmit={handleUpload} className="upload-form">
          {/* Video Title */}
          <div className="upload-field">
            <label htmlFor="video-title" className="upload-label">
              Video Title <span className="upload-required">*</span>
            </label>
            <input
              id="video-title"
              type="text"
              placeholder="Enter a descriptive title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="upload-input"
            />
          </div>

          {/* Description */}
          <div className="upload-field">
            <label htmlFor="video-description" className="upload-label">
              Description
            </label>
            <textarea
              id="video-description"
              placeholder="Tell viewers what your video is about…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="upload-textarea"
              rows={4}
            />
          </div>

          {/* File picker */}
          <div className="upload-field">
            <label className="upload-label">
              Video File <span className="upload-required">*</span>
            </label>
            <label htmlFor="video-file" className="upload-file-label">
              <span className="upload-file-icon">📁</span>
              <span className="upload-file-text">
                {videoFile ? videoFile.name : "Click to choose a video file"}
              </span>
              <span className="upload-file-hint">MP4, MOV, AVI, MKV…</span>
            </label>
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              required
              className="upload-file-input"
            />
          </div>

          {/* Divider */}
          <hr className="upload-divider" />

          {/* Live Premier toggle */}
          <div className="upload-field">
            <label className="upload-toggle-row" htmlFor="isPremier">
              <div className="upload-toggle-info">
                <span className="upload-toggle-label">Schedule as Live Premiere</span>
                <span className="upload-toggle-hint">
                  Set a future date &amp; time for a live premiere event
                </span>
              </div>
              <div className="upload-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="isPremier"
                  checked={isPremier}
                  onChange={(e) => setIsPremier(e.target.checked)}
                  className="upload-checkbox"
                />
                <span className="upload-checkbox-track" aria-hidden="true" />
              </div>
            </label>
          </div>

          {/* Premier date/time (conditional) */}
          {isPremier && (
            <div className="upload-field upload-premier-field">
              <label htmlFor="premierTime" className="upload-label">
                Premiere Date &amp; Time <span className="upload-required">*</span>
              </label>
              <input
                id="premierTime"
                type="datetime-local"
                value={premierTime}
                onChange={(e) => setPremierTime(e.target.value)}
                required
                className="upload-input"
              />
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="upload-submit-btn">
            Upload Video
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadVideo;
