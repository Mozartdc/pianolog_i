"use client";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";

// 아이콘 imports
import AppleSongIcon from "../assets/icons/applesong.svg?react";
import AppleResetIcon from "../assets/icons/apple reset.svg?react";
import AppleMinusIcon from "../assets/icons/appleminus.svg?react";
import { usePracticeData } from "../contexts/PracticeDataContext";
// Header는 이 페이지에서 사용하지 않으므로 import 문을 제거해도 됩니다.
// import Header from "../components/Header";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function AppleScreen() {
  const query = useQuery();
  const trackIdParam = query.get("trackId");
  const trackId = trackIdParam ? Number(trackIdParam) : null;

  const { tracks, partialCounts, practiceChecks, incPartial, decPartial, setPartialCounts, toggleCheck } = usePracticeData();
  const [count, setCount] = useState(0);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const track = trackId !== null ? tracks.find((t) => t.id === trackId) : null;
  const displayTitle = track ? track.title : "practice";
  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    if (trackId !== null) {
      const todayCounts = partialCounts[today] || {};
      setCount(todayCounts[trackId] || 0);
    }
  }, [partialCounts, trackId, today]);

  const handlePlus = () => {
    if (trackId === null) return;
    const isChecked = !!(practiceChecks[today] && practiceChecks[today][trackId]);
    if (count === 0 && !isChecked) {
      toggleCheck(today, trackId);
    }
    incPartial(today, trackId);
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trackId === null) return;
    decPartial(today, trackId);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trackId === null) return;
    if (confirm("카운트를 초기화하시겠습니까?")) {
        setPartialCounts(prev => {
            const dayCounts = prev[today] || {};
            const updatedDayCounts = { ...dayCounts, [trackId]: 0 };
            return { ...prev, [today]: updatedDayCounts };
        });
    }
  };

  return (
    // ✅ 1. 전체 화면을 클릭 가능하게 하고, Flexbox 레이아웃의 기준이 됩니다.
    <div
      onClick={handlePlus}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        touchAction: "manipulation",
        ...commonFontStyle
      }}
    >
      {/* ✅ 2. 중앙 콘텐츠 영역: flex-grow: 1로 남는 공간을 모두 차지하여 버튼을 아래로 밀어냅니다. */}
      <div style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }}>
          {/* ✅ 아이콘 크기(width, height)를 지정하여 보이도록 수정했습니다. */}
          <AppleSongIcon style={{ color: "var(--text-primary)", width: 24, height: 24 }} />
          <span style={{ fontSize: 16, fontWeight: "normal" }}>{displayTitle}</span>
        </div>

        <div style={{ fontSize: 20, color: "var(--text-secondary)", fontWeight: "normal", marginBottom: 25 }}>
          practice
        </div>

        <div style={{ fontSize: 128, textAlign: "center", lineHeight: 1, letterSpacing: "0.05em", fontWeight: 600 }}>
          {count}
        </div>
      </div>

      {/* ✅ 3. 하단 버튼 영역: 페이지 흐름의 가장 아래에 위치하며, 하단에 충분한 여백을 가집니다. */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        paddingBottom: `calc(60px + env(safe-area-inset-bottom, 0px) + 20px)`,
        boxSizing: "border-box",
        flexShrink: 0
      }}>
        <button
          onClick={handleReset}
          style={{
            background: "var(--button-secondary-bg)",
            border: "none", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer", padding: "10px 16px", ...commonFontStyle
          }}
        >
          <AppleResetIcon style={{ color: "var(--text-primary)", width: 16, height: 16 }} />
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>Reset</span>
        </button>

        <button
          onClick={handleMinus}
          style={{
            background: "var(--button-secondary-bg)",
            border: "none", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer", padding: "10px 16px", ...commonFontStyle
          }}
        >
          <AppleMinusIcon style={{ color: "var(--text-primary)", width: 16, height: 16 }} />
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>minus</span>
        </button>
      </div>
    </div>
  );
}

export default AppleScreen;