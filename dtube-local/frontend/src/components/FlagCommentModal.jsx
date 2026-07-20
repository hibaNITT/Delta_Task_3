import { useState } from "react";
import api from "../api";

export default function FlagCommentModal({ commentId, onClose, onSuccess }) {
  const [reason, setReason] = useState("malicious");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Flagging comment:", commentId, { reason, description });
      const response = await api.post(`/api/flags/comment/${commentId}`, {
        reason,
        description,
      });
      console.log("Flag success:", response.data);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Flag error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to flag comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Report Comment</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Reason:</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="malicious">Malicious/Harmful</option>
              <option value="copyright">Copyright</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why you're reporting this..."
            />
          </div>

          {error && <p className="error">{error}</p>}

          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Report"}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
