"use client";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// 아이콘 imports
import AppleSongIcon from "../assets/icons/applesong.svg?react";
import AppleResetIcon from "../assets/icons/apple reset.svg?react";
import AppleMinusIcon from "../assets/icons/appleminus.svg?react";

type Track = { id: number; title: string; addedDate: string };
type PartialCounts = { [key: string]: number };

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function AppleScreen() {
  const query = useQuery();
  const trackIdParam = query.get("trackId");
  const trackId = trackIdParam ? Number(trackIdParam) : null;
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [partialCounts, setPartialCounts] = useState<PartialCounts>({});
  const [count, setCount] = useState(0);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // 데이터 로드
  useEffect(() => {
    const savedTracks = localStorage.getItem("tracks");
    setTracks(savedTracks ? JSON.parse(savedTracks) : []);
    const savedCounts = localStorage.getItem("partialCounts");
    setPartialCounts(savedCounts ? JSON.parse(savedCounts) : {});
  }, []);

  const track = trackId !== null ? tracks.find((t) => t.id === trackId) : null;
  const displayTitle = track ? track.title : "piano";
  const countKey = trackId !== null && track ? String(trackId) : "piano";

  // 카운트 동기화
  useEffect(() => {
    setCount(partialCounts[countKey] || 0);
  }, [partialCounts, countKey]);

  // +1 (화면 클릭)
  const handlePlus = () => {
    const newCount = count + 1;
    setCount(newCount);
    const updated = { ...partialCounts, [countKey]: newCount };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  // -1 (버튼)
  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = Math.max(count - 1, 0);
    setCount(newCount);
    const updated = { ...partialCounts, [countKey]: newCount };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  // 리셋 (버튼)
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCount(0);
    const updated = { ...partialCounts, [countKey]: 0 };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  return (
    <div
      className="apple-screen"
      style={{
        width: "100%",
        maxWidth: "100%",
        height: "100vh",
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
        padding: "20px 16px"
      }}
      onClick={handlePlus}
    >
      {/* 중앙 콘텐츠 */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexGrow: 1,
        justifyContent: "center",
        width: "100%"
      }}>
        {/* 곡명 + 아이콘 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 15,
          ...commonFontStyle
        }}>
          <AppleSongIcon style={{ color: "var(--text-primary)" }} width="24" height="24" />
          <span style={{
            fontSize: 16,
            fontWeight: "normal",
            textAlign: "center",
            lineHeight: "24px"
          }}>
            {displayTitle}
          </span>
        </div>

        {/* Practice */}
        <div style={{
          fontSize: 20,
          color: "var(--text-secondary)",
          fontWeight: "normal",
          textAlign: "center",
          lineHeight: "24px",
          marginBottom: 25,
          ...commonFontStyle
        }}>
          practice
        </div>

        {/* 숫자 */}
        <div
          className="apple-screen__number"
          style={{
            fontSize: 128,
            textAlign: "center",
            lineHeight: "80px",
            letterSpacing: "0.05em",
            fontWeight: 600,
            ...commonFontStyle
          }}
        >
          {count}
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div style={{
        position: "absolute",
        bottom: 40,
        width: "calc(100% - 32px)",
        maxWidth: "343px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "0 auto"
      }}>
        {/* Reset 버튼 */}
        <button
          onClick={handleReset}
          style={{
            width: 85,
            height: 40,
            background: "var(--button-secondary-bg)",
            border: "none",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            ...commonFontStyle
          }}
        >
          <AppleResetIcon style={{ color: "var(--text-primary)" }} width="16" height="16" />
          <span style={{
            fontSize: 14,
            color: "var(--text-primary)",
            fontWeight: "normal",
            lineHeight: "22px"
          }}>
            Reset
          </span>
        </button>

        {/* minus 버튼 */}
        <button
          onClick={handleMinus}
          style={{
            width: 85,
            height: 40,
            background: "var(--button-secondary-bg)",
            border: "none",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            ...commonFontStyle
          }}
        >
          <AppleMinusIcon style={{ color: "var(--text-primary)" }} width="16" height="16" />
          <span style={{
            fontSize: 14,
            color: "var(--text-primary)",
            fontWeight: "normal",
            lineHeight: "22px",
            display: 'flex',
            alignItems: 'center'
          }}>
            minus
          </span>
        </button>
      </div>
    </div>
  );
}

export default AppleScreen;
