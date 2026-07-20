import { useState, useEffect } from "react";
import api from "../api";

export default function AdminPanel() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPendingFlags();
  }, []);

  const fetchPendingFlags = async () => {
    try {
      const response = await api.get("/api/flags/admin/pending");
      setFlags(response.data);
    } catch (err) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (flagId, status, adminNotes) => {
    try {
      await api.put(`/api/flags/admin/${flagId}`, { status, adminNotes });
      setFlags(flags.filter((f) => f._id !== flagId));
    } catch (err) {
      alert("Failed to resolve report");
    }
  };

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-panel">
      <h2>Admin - Pending Reports ({flags.length})</h2>

      {flags.length === 0 ? (
        <p>No pending reports</p>
      ) : (
        <div className="flags-list">
          {flags.map((flag) => (
            <div key={flag._id} className="flag-card">
              <div className="flag-header">
                <span className="flag-type">{flag.type.toUpperCase()}</span>
                <span className="flag-reason">{flag.reason}</span>
              </div>

              <p>
                <strong>Reported by:</strong> {flag.reportedBy?.username}
              </p>
              <p>
                <strong>Description:</strong> {flag.description}
              </p>

              <div className="flag-actions">
                <button
                  className="btn-resolve"
                  onClick={() =>
                    handleResolve(
                      flag._id,
                      "resolved",
                      "Content removed for violation",
                    )
                  }
                >
                  Remove Content
                </button>
                <button
                  className="btn-dismiss"
                  onClick={() =>
                    handleResolve(flag._id, "dismissed", "No violation found")
                  }
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
