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

function AppleScreen() { // 컴포넌트 이름은 AppleScreen으로 유지
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
  const displayTitle = track ? track.title : "piano";
  // 카운트 키: trackId 있으면 trackId, 없으면 "Piano"
  const countKey = trackId !== null && track ? String(trackId) : "piano";

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
        maxWidth: 375, // 최대 너비는 375px로 유지
        height: "100vh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        margin: "0 auto",
        touchAction: "manipulation",
        userSelect: "none",
        boxSizing: "border-box", // 패딩 적용을 위해 추가
        padding: "20px 16px" // 상하좌우 패딩 추가 (하단 버튼과 겹치지 않도록 조절 필요)
      }}
      onClick={handlePlus}
    >
      {/* 중앙 콘텐츠 */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexGrow: 1, // 남은 공간을 차지하여 중앙에 위치하도록 함
        justifyContent: "center", // 중앙 정렬
        width: "100%" // 내용이 부모 너비를 따르도록
      }}>
        {/* 곡명 + 아이콘 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 15,
          ...commonFontStyle // 폰트 스타일 적용
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
          marginBottom: 25,
          ...commonFontStyle // 폰트 스타일 적용
        }}>
          practice
        </div>

        {/* ✅ 숫자: 폰트 굵기 (fontWeight: 600) 및 폰트 스타일 적용 */}
        <div 
          className="apple-screen__number"
          style={{
            fontSize: 128,
            color: "#2D2D2A",
            textAlign: "center",
            lineHeight: "80px",
            letterSpacing: "0.1em",
            fontWeight: 600, // ✅ 여기를 600으로 설정하여 굵게 표시
            ...commonFontStyle // ✅ 폰트 스타일 적용
          }}
        >
          {count}
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div style={{
        position: "absolute",
        bottom: 40,
        // ✅ 수정: 고정된 gap 대신 width 100%와 space-between으로 반응형 레이아웃 구성
        width: "calc(100% - 32px)", // 좌우 16px 패딩을 제외한 너비 (375px - 32px = 343px)
        maxWidth: 343, // 최대 너비는 343px로 유지
        display: "flex",
        justifyContent: "space-between", // 양쪽 끝으로 버튼 배치
        alignItems: "center",
        margin: "0 auto" // 중앙 정렬
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
            cursor: "pointer",
            ...commonFontStyle // 폰트 스타일 적용
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
            cursor: "pointer",
            ...commonFontStyle // 폰트 스타일 적용
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

export default AppleScreen; // 이 부분은 AppleScreen 컴포넌트를 export 하므로 문제 없습니다.