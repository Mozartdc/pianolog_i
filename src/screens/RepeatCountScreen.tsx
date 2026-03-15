"use client";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";

// Icon imports
import AppleSongIcon from "../assets/icons/applesong.svg?react";
// Replaced with new icons
import DownIcon from "../assets/icons/down.svg?react";
import ResetIcon from "../assets/icons/reset.svg?react";
// Import additional functions from central data management
import { usePracticeData } from "../contexts/PracticeDataContext";

function useQuery() {
return new URLSearchParams(useLocation().search);
}

function AppleScreen() {
const query = useQuery();
const trackIdParam = query.get("trackId");
const trackId = trackIdParam ? Number(trackIdParam) : null;

// Import toggleCheck function from central management
const { tracks, partialCounts, practiceChecks, incPartial, decPartial, setPartialCounts, toggleCheck } = usePracticeData();
const [count, setCount] = useState(0);

const commonFontStyle = {
fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
WebkitFontSmoothing: "antialiased" as const,
MozOsxFontSmoothing: "grayscale" as const
};

const track = trackId !== null ? (tracks.find((t) => t.id === trackId) ?? null) : null;
const displayTitle = track ? track.title : "piano";
const today = dayjs().format("YYYY-MM-DD");

useEffect(() => {
  const todayCounts = partialCounts[today] || {};
  // If trackId exists, get that track's count; otherwise get 'practice' count
  const key = trackId !== null ? trackId : 'practice';
  setCount(todayCounts[key] || 0);
}, [partialCounts, trackId, today]);

// Add checkbox integration logic to +1 handler
  const handlePlus = () => {
    // Update count state first for immediate UI reflection
    const newCount = count + 1;
    setCount(newCount);

    if (trackId !== null) {
      // --- When specific track is selected ---
      // Checkbox integration logic
      const isChecked = !!(practiceChecks[today] && practiceChecks[today][trackId]);
      if (count === 0 && !isChecked) {
        toggleCheck(today, trackId);
      }
      // Update central management data
      incPartial(today, trackId);
    } else {
      // --- When no specific track is selected (general practice) ---
      // Directly modify central management data to increase 'practice' key count
      setPartialCounts(prev => {
        const todayCounts = prev[today] || {};
        const updatedDayCounts = { ...todayCounts, practice: newCount };
        return { ...prev, [today]: updatedDayCounts };
      });
    }
  };

const handleMinus = (e: React.MouseEvent) => {
  e.stopPropagation();
  const newCount = Math.max(count - 1, 0);
  setCount(newCount);

  if (trackId !== null) {
    decPartial(today, trackId);
  } else {
    setPartialCounts((prev) => {
      const todayCounts = prev[today] || {};
      const updatedDayCounts = { ...todayCounts, practice: newCount };
      return { ...prev, [today]: updatedDayCounts };
    });
  }
};


const handleReset = (e: React.MouseEvent) => {
  e.stopPropagation();
  setCount(0);

  if (trackId !== null) {
    setPartialCounts((prev) => {
      const dayCounts = prev[today] || {};
      const updatedDayCounts = { ...dayCounts, [trackId]: 0 };
      return { ...prev, [today]: updatedDayCounts };
    });
  } else {
    setPartialCounts((prev) => {
      const dayCounts = prev[today] || {};
      const updatedDayCounts = { ...dayCounts, practice: 0 };
      return { ...prev, [today]: updatedDayCounts };
    });
  }
};


return (
  <div
    className="apple-screen"
    style={{
      position: "fixed", // Fixed position
      top: 0,
      left: 0,
      width: "100vw",
      height: "100dvh",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 16px",
      paddingTop: "calc(env(safe-area-inset-top, 0px) + 5px)",
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)", // Give buttons some space
      overflow: "hidden", // Completely block scrolling
      boxSizing: "border-box",
      zIndex: 99,
      touchAction: "manipulation",
      userSelect: "none"
    }}
    onClick={(e) => {
  // Ignore if clicking inside button (prevent number increment)
  if ((e.target as HTMLElement).closest("button")) return;
  handlePlus();
}}
  >

    {/* Center content block */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1, // Evenly distribute space between top and bottom
      textAlign: "center",
      width: "100%"
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 15, ...commonFontStyle
      }}>
        <AppleSongIcon style={{ color: "var(--text-primary)" }} width="24" height="24" />
        <span style={{ fontSize: 16, fontWeight: "normal", lineHeight: "24px" }}>{displayTitle}</span>
      </div>

      <div style={{
        fontSize: 20, color: "var(--text-secondary)", fontWeight: "normal",
        lineHeight: "24px", marginBottom: 25, ...commonFontStyle
      }}>
        practice
      </div>

      <div style={{
        fontSize: 128, fontWeight: 600, lineHeight: "80px",
        letterSpacing: "0.05em", ...commonFontStyle
      }}>
        {count}
      </div>
    </div>

    {/* Bottom buttons - icon only, center aligned */}
    <div style={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 150 // Gap between two buttons
    }}>
      {/* Reset button */}
      <button
        onClick={handleReset}
        style={{
          width: 60,
          height: 60,
          background: "none",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          borderRadius: "50%", // Circular touch area
          padding: 0
        }}
      >
        <ResetIcon 
          style={{ color: "var(--text-primary)" }} 
          width="24" 
          height="24" 
        />
      </button>

      {/* Minus button */}
      <button
        onClick={handleMinus}
        style={{
          width: 60,
          height: 60,
          background: "none",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          borderRadius: "50%", // Circular touch area
          padding: 0
        }}
      >
        <DownIcon 
          style={{ color: "var(--text-primary)" }} 
          width="24" 
          height="24" 
        />
      </button>
    </div>
  </div>
);
}

export default AppleScreen;
