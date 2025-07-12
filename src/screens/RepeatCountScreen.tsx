"use client";
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";

// 아이콘 imports
import AppleSongIcon from "../assets/icons/applesong.svg?react";
import AppleResetIcon from "../assets/icons/apple reset.svg?react";
import AppleMinusIcon from "../assets/icons/appleminus.svg?react";
// ✅ [수정] 중앙 데이터 관리소에서 필요한 함수들을 추가로 가져옵니다.
import { usePracticeData } from "../contexts/PracticeDataContext";

function useQuery() {
return new URLSearchParams(useLocation().search);
}

function AppleScreen() {
const query = useQuery();
const trackIdParam = query.get("trackId");
const trackId = trackIdParam ? Number(trackIdParam) : null;

// ✅ [수정] 중앙 관리소에서 toggleCheck 함수를 추가로 가져옵니다.
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
  const todayCounts = partialCounts[today] || {};
  // ✅ trackId가 있으면 해당 곡의 카운트를, 없으면 'practice'의 카운트를 가져옴
  const key = trackId !== null ? trackId : 'practice';
  setCount(todayCounts[key] || 0);
}, [partialCounts, trackId, today]);

// ✅ [수정] +1 핸들러에 체크박스 연동 로직 추가
// ✅ [수정] +1 핸들러에 체크박스 연동 로직 추가
  const handlePlus = () => {
    // UI에 즉시 반영되도록 count 상태를 먼저 업데이트합니다.
    const newCount = count + 1;
    setCount(newCount);

    if (trackId !== null) {
      // --- 특정 곡이 선택된 경우 ---
      // 체크박스 연동 로직
      const isChecked = !!(practiceChecks[today] && practiceChecks[today][trackId]);
      if (count === 0 && !isChecked) {
        toggleCheck(today, trackId);
      }
      // 중앙 관리 데이터 업데이트
      incPartial(today, trackId);
    } else {
      // --- 특정 곡이 선택되지 않은 경우 (일반 practice) ---
      // 중앙 관리 데이터를 직접 수정하여 'practice' 키의 카운트를 올립니다.
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
      position: "fixed", // ✅ 고정
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
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)", // ✅ 여유있게 버튼 띄움
      overflow: "hidden", // ✅ 스크롤 완전 차단
      boxSizing: "border-box",
      zIndex: 99,
      touchAction: "manipulation",
      userSelect: "none"
    }}
    onClick={(e) => {
  // 버튼 내부 클릭이면 무시 (숫자 올라가지 않게)
  if ((e.target as HTMLElement).closest("button")) return;
  handlePlus();
}}
  >

    {/* 중앙 덩어리 */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1, // ✅ 위 아래 사이에서 공간 균등 확보
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

    {/* 하단 버튼 */}
    <div style={{
      width: "100%",
      maxWidth: "343px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <button
        onClick={handleReset}
        style={{
          width: 85, height: 40, background: "var(--bg-secondary)",
          border: "none", borderRadius: 8, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer", ...commonFontStyle
        }}
      >
        <AppleResetIcon style={{ color: "var(--text-secondary)" }} width="16" height="16" />
        <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: "22px" }}>Reset</span>
      </button>

      <button
        onClick={handleMinus}
        style={{
          width: 85, height: 40, background: "var(--bg-secondary)",
          border: "none", borderRadius: 8, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer", ...commonFontStyle
        }}
      >
        <AppleMinusIcon style={{ color: "var(--text-secondary)" }} width="16" height="16" />
        <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: "22px" }}>minus</span>
      </button>
    </div>
  </div>
);
}

export default AppleScreen;