import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lottie from 'lottie-react';
import metronomeAnimation from '../assets/metronome.json';

function Metronome() {
  const location = useLocation();

  // 스크롤 방지 (홈스크린처럼)
  useEffect(() => {
    if (location.pathname === '/metronome') {
      const originalBodyStyle = document.body.style.cssText;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';

      return () => {
        document.body.style.cssText = originalBodyStyle;
      };
    }
  }, [location.pathname]);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        background: "var(--bg-primary)",
        overflowX: "hidden",
        overflowY: "hidden", // 스크롤 완전 차단
        margin: "0 auto",
        padding: "0",
        boxSizing: "border-box",
        ...commonFontStyle,
      }}
    >
      {/* 중앙 콘텐츠 영역 - 헤더 제거 */}
      <div
        style={{
          width: "100%",
          height: "100vh", // 전체 화면 사용
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          ...commonFontStyle,
        }}
      >
        {/* Lottie 메트로놈 애니메이션 */}
        <div
          style={{
            width: 200,
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lottie
            animationData={metronomeAnimation}
            loop={true}
            autoplay={true}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        {/* "기다려" 텍스트 */}
       <span
  style={{
    fontSize: 14,
    color: "var(--text-secondary)",
    fontWeight: "normal",
    ...commonFontStyle,
    textAlign: "center",
    lineHeight: 1.4,
    display: "block",
  }}
>
  청년 디지털 피아노 공공 메트로놈
  <br />
  (2030년 예정)
</span>

      </div>
    </div>
  );
}

export default Metronome;