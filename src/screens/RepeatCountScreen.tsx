"use client";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";

// 아이콘 imports
import AppleSongIcon from "../assets/icons/applesong.svg?react";
import AppleResetIcon from "../assets/icons/apple reset.svg?react";
import AppleMinusIcon from "../assets/icons/appleminus.svg?react";
import { usePracticeData } from "../contexts/PracticeDataContext";
import Header from "../components/Header";

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
    // ✅ 1. 기준이 되는 부모 컨테이너
    <div
      style={{
        width: "100%",
        height: "100vh", // 화면 전체 높이 고정
        overflow: "hidden", // 스크롤 방지
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        position: "relative", // 버튼 위치의 기준점이 됨
        ...commonFontStyle
      }}
    >
      {/* ✅ 2. 중앙 콘텐츠 영역: 화면 전체를 차지하고 내용을 중앙 정렬 */}
      <div 
        onClick={handlePlus}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }}>
          <AppleSongIcon style={{ color: "var(--text-primary)" }} />
          <span style={{ fontSize: 16, fontWeight: "normal" }}>{displayTitle}</span>
        </div>

        <div style={{ fontSize: 20, color: "var(--text-secondary)", fontWeight: "normal", marginBottom: 25 }}>
          practice
        </div>

        <div style={{ fontSize: 128, textAlign: "center", lineHeight: 1, letterSpacing: "0.05em", fontWeight: 600 }}>
          {count}
        </div>
      </div>

      {/* ✅ 3. 하단 버튼 영역: 화면 하단에 고정 */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        padding: "20px 24px",
        // 하단 탭 바(60px)와 안전 영역을 고려한 충분한 여백 확보
        paddingBottom: `calc(60px + env(safe-area-inset-bottom, 0px) + 20px)`,
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
          {/* ✅ 아이콘 크기 지정 */}
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
          {/* ✅ 아이콘 크기 지정 */}
          <AppleMinusIcon style={{ color: "var(--text-primary)", width: 16, height: 16 }} />
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>minus</span>
        </button>
      </div>
    </div>
  );
}

export default AppleScreen;