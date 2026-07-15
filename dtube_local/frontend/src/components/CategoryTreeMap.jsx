import React from "react";

const CategoryTreeMap = () => {
  // Mock data tracking video categories and their relative counts
  const categories = [
    { name: "Tech & Coding", count: 50, color: "#3B82F6" }, // Blue
    { name: "Gaming", count: 30, color: "#10B981" }, // Green
    { name: "Music & Audio", count: 15, color: "#F59E0B" }, // Orange
    { name: "Vlogs", count: 5, color: "#EF4444" }, // Red
  ];

  // Sum up all videos to calculate ratios..
  const totalVideos = categories.reduce((sum, item) => sum + item.count, 0);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Video Category Distribution Dashboard</h2>
      <p>
        Total Managed Platform Assets: <strong>{totalVideos} videos</strong>
      </p>

      {/* Outer Flex Container for the TreeMap blocks */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "220px",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #ddd",
          backgroundColor: "#f9f9f9",
        }}
      >
        {categories.map((cat, index) => {
          // derive percentage width share
          const widthPercentage = (cat.count / totalVideos) * 100;

          return (
            <div
              key={index}
              style={{
                width: `${widthPercentage}%`,
                backgroundColor: cat.color,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                transition: "width 0.4s ease",
                padding: "10px",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                {cat.name}
              </div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                {cat.count} clips ({Math.round(widthPercentage)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTreeMap;
