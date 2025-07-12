"use client";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";

// 아이콘 imports
import AppleSongIcon from "../assets/icons/applesong.svg?react";
import AppleResetIcon from "../assets/icons/apple reset.svg?react";
import AppleMinusIcon from "../assets/icons/appleminus.svg?react";
// ✅ 중앙 데이터 관리소와 헤더를 추가로 가져옵니다.
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
    const newCount = count + 1;
    setCount(newCount);
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
    // ✅ 1. 전체 레이아웃을 Flexbox로 변경하고 스크롤을 막습니다.
    <div style={{
      width: "100%",
      height: "100vh", // 화면 전체 높이 고정
      overflow: "hidden", // 스크롤 방지
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column", // 세로 방향 정렬
      ...commonFontStyle
    }}>
      <Header title={displayTitle} color="var(--text-primary)" />

      {/* ✅ 2. 중앙 콘텐츠 영역: 남은 공간을 모두 차지하여 내용을 중앙 정렬합니다. */}
      <div 
        onClick={handlePlus}
        style={{
          flexGrow: 1, // 남은 공간을 모두 차지
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "16px" // 내부 여백
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 15
        }}>
          <AppleSongIcon style={{ color: "var(--text-primary)" }} />
          <span style={{ fontSize: 16, fontWeight: "normal" }}>
            {displayTitle}
          </span>
        </div>

        <div style={{
          fontSize: 20, color: "var(--text-secondary)", fontWeight: "normal",
          marginBottom: 25
        }}>
          practice
        </div>

        <div style={{
            fontSize: 128, textAlign: "center", lineHeight: 1,
            letterSpacing: "0.05em", fontWeight: 600
          }}
        >
          {count}
        </div>
      </div>

      {/* ✅ 3. 하단 버튼 영역: Flex 아이템으로 만들어 흐름에 맞게 배치합니다. */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        // 하단 탭 바 높이(60px) + 안전 영역 + 추가 여백(20px) 만큼 공간 확보
        paddingBottom: "calc(60px + env(safe-area-inset-bottom, 20px) + 20px)", 
        flexShrink: 0, // 크기가 줄어들지 않도록 고정
        boxSizing: "border-box"
      }}>
        <button onClick={handleReset} style={{
            background: "var(--bg-secondary)", border: "none", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer", padding: "10px 16px", ...commonFontStyle
          }}>
          <AppleResetIcon style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>Reset</span>
        </button>

        <button onClick={handleMinus} style={{
            background: "var(--bg-secondary)", border: "none", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer", padding: "10px 16px", ...commonFontStyle
          }}>
          <AppleMinusIcon style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>minus</span>
        </button>
      </div>
    </div>
  );
}

export default AppleScreen;