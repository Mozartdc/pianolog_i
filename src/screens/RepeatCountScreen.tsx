// src/screens/AppleScreen.tsx

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
<div style={{ color: "red", fontSize: 20 }}>🚨 최신 코드 적용됨</div>
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
  const displayTitle = track ? track.title : "연습";
  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    if (trackId !== null) {
      const todayCounts = partialCounts[today] || {};
      setCount(todayCounts[trackId] || 0);
    }
  }, [partialCounts, trackId, today]);

  // ✅ [수정] +1 핸들러에 체크박스 연동 로직 추가
  const handlePlus = () => {
    if (trackId === null) return;

    // 만약 카운트가 0에서 1로 올라가는 순간이고, 아직 체크가 안되어 있다면 체크 실행
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
    const newCount = Math.max(count - 1, 0);
    setCount(newCount);
    decPartial(today, trackId);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trackId === null) return;
    setCount(0);
    setPartialCounts(prev => {
        const dayCounts = prev[today] || {};
        const updatedDayCounts = { ...dayCounts, [trackId]: 0 };
        return { ...prev, [today]: updatedDayCounts };
    });
  };

  return (
<div
  className="apple-screen"
  style={{
    width: "100%",
    maxWidth: "100%",
    height: "100dvh", // ✅ 변경
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    margin: "0 auto",
    touchAction: "manipulation",
    userSelect: "none",
    boxSizing: "border-box",
    padding: "0 16px",
    paddingTop: "5px", // ✅ 추가
    paddingBottom: 40
  }}
  onClick={handlePlus}
>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        flexGrow: 1, justifyContent: "center", width: "100%"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 15, ...commonFontStyle
        }}>
          <AppleSongIcon style={{ color: "var(--text-primary)" }} width="24" height="24" />
          <span style={{ fontSize: 16, fontWeight: "normal", textAlign: "center", lineHeight: "24px" }}>
            {displayTitle}
          </span>
        </div>

        <div style={{
          fontSize: 20, color: "var(--text-secondary)", fontWeight: "normal",
          textAlign: "center", lineHeight: "24px", marginBottom: 25,
          ...commonFontStyle
        }}>
          practice
        </div>

        <div
          className="apple-screen__number"
          style={{
            fontSize: 128, textAlign: "center", lineHeight: "80px",
            letterSpacing: "0.05em", fontWeight: 600, ...commonFontStyle
          }}
        >
          {count}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 40, width: "calc(100% - 32px)",
        maxWidth: "343px", display: "flex", justifyContent: "space-between",
        alignItems: "center", margin: "0 auto"
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
          <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: "normal", lineHeight: "22px", display: 'flex', alignItems: 'center' }}>
            Reset
          </span>
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
          <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: "normal", lineHeight: "22px", display: 'flex', alignItems: 'center' }}>
            minus
          </span>
        </button>
      </div>
    </div>
    
  );
}

export default AppleScreen;