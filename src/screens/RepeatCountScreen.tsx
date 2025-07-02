"use client";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// 아이콘 imports
import AppleSongIcon from "../assets/icons/applesong.svg";
import AppleResetIcon from "../assets/icons/apple reset.svg";
import AppleMinusIcon from "../assets/icons/appleminus.svg";

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

  // 곡 정보 불러오기
  useEffect(() => {
    const savedTracks = localStorage.getItem("tracks");
    setTracks(savedTracks ? JSON.parse(savedTracks) : []);
    const savedCounts = localStorage.getItem("partialCounts");
    setPartialCounts(savedCounts ? JSON.parse(savedCounts) : {});
  }, []);

  // 곡 정보 찾기
  const track = trackId !== null
    ? tracks.find((t) => t.id === trackId)
    : null;

  // 곡명: 곡이 있으면 곡명, 없으면 Piano
  const displayTitle = track ? track.title : "Piano";
  // 카운트 키: trackId 있으면 trackId, 없으면 "Piano"
  const countKey = trackId !== null && track ? String(trackId) : "Piano";

  // 카운트 동기화
  useEffect(() => {
    setCount(partialCounts[countKey] || 0);
  }, [partialCounts, countKey]);

  // +1 (화면 아무데나 클릭)
  const handlePlus = () => {
    const newCount = count + 1;
    setCount(newCount);
    const updated = { ...partialCounts, [countKey]: newCount };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  // -1 (하단 버튼)
  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCount = Math.max(count - 1, 0);
    setCount(newCount);
    const updated = { ...partialCounts, [countKey]: newCount };
    setPartialCounts(updated);
    localStorage.setItem("partialCounts", JSON.stringify(updated));
  };

  // 리셋 (하단 버튼)
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
        maxWidth: 375,
        height: "100vh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        margin: "0 auto",
        touchAction: "manipulation",
        userSelect: "none"
      }}
      onClick={handlePlus}
    >
      {/* 중앙 콘텐츠 */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {/* 곡명 + 아이콘 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 15
        }}>
          <img src={AppleSongIcon} alt="apple song" width="24" height="24" />
          <span style={{
            fontSize: 16,
            color: "#2D2D2A",
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
          color: "#9E9C98",
          fontWeight: "normal",
          textAlign: "center",
          lineHeight: "24px",
          marginBottom: 25
        }}>
          Practice
        </div>

        {/* ✅ 숫자: 클래스 적용으로 폰트 문제 해결 */}
        <div 
          className="apple-screen__number"
          style={{
            fontSize: 128,
            color: "#2D2D2A",
            textAlign: "center",
            lineHeight: "128px",
            letterSpacing: "0.1em"
          }}
        >
          {count}
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div style={{
        position: "absolute",
        bottom: 40,
        display: "flex",
        gap: 157,
        alignItems: "center"
      }}>
        {/* Reset 버튼 */}
        <button
          onClick={handleReset}
          style={{
            width: 85,
            height: 40,
            background: "#F0EADB",
            border: "none",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer"
          }}
        >
          <img src={AppleResetIcon} alt="reset" width="16" height="16" />
          <span style={{
            fontSize: 14,
            color: "#2D2D2A",
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
            background: "#F0EADB",
            border: "none",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer"
          }}
        >
          <img src={AppleMinusIcon} alt="minus" width="16" height="16" />
          <span style={{
            fontSize: 14,
            color: "#2D2D2A",
            fontWeight: "normal",
            lineHeight: "22px"
          }}>
            minus
          </span>
        </button>
      </div>
    </div>
  );
}

export default AppleScreen;