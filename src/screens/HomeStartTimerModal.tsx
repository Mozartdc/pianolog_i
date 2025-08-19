import React, { useRef, useEffect } from "react";
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import PauseIcon from "../assets/icons/pause.svg?react";
import ReplayIcon from "../assets/icons/replay.svg?react";
import playpianoAnimation from "../assets/Playpiano.json";

interface HomeStartTimerModalProps {
  timerSeconds: number;
  timerMilliseconds: number; // 추가
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onEdit: () => void;
}

export function HomeStartTimerModal({
  timerSeconds,
  timerMilliseconds, // 추가
  isRunning,
  onPause,
  onResume,
  onComplete,
  onEdit
}: HomeStartTimerModalProps) {
  const totalMs = timerMilliseconds; // HomeScreen에서 받은 값 사용
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const totalSecondsOnly = Math.floor((totalMs % 60000) / 1000);
  const centiseconds = Math.floor((totalMs % 1000) / 10);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // 일시정지 시 애니메이션도 제어
  useEffect(() => {
    if (lottieRef.current) {
      if (isRunning) {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
  }, [isRunning]);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
   <div style={{
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
  paddingBottom: 12,
  zIndex: 100,
  pointerEvents: "none"
}}>
  <div style={{
    width: "calc(100% - 32px)",
    margin: "12px auto 0 auto",
    height: 97,
    background: "var(--bg-primary)",
    border: "0.5px solid var(--TURQUOISE)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 16,
    pointerEvents: "auto"
  }}>
        {/* Lottie 피아노 애니메이션 */}
        <div
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={playpianoAnimation}
            loop={true}
            autoplay={true}
            style={{ 
              width: 40, 
              height: 40 
            }}
          />
        </div>

        {/* 중앙 상태 및 시간 표시 */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4
        }}>
          <span style={{
            fontSize: 14,
            color: "var(--VIVA_MAGENTA)",
            lineHeight: "20px",
            ...commonFontStyle
          }}>
            {isRunning ? "피출중" : "피 휴"}
          </span>

          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            color: "var(--text-primary)"
          }}>
            {hours > 0 && (
              <>
                <span style={{ fontSize: 32, lineHeight: "32px", ...commonFontStyle }}>
                  {hours}
                </span>
                <span style={{ fontSize: 20, lineHeight: "32px", ...commonFontStyle }}>
                  h
                </span>
              </>
            )}

            <span style={{ fontSize: 32, lineHeight: "32px", ...commonFontStyle }}>
              {minutes}
            </span>
            <span style={{ fontSize: 20, lineHeight: "32px", ...commonFontStyle }}>
              m
            </span>

            <span style={{ fontSize: 14, lineHeight: "20px", ...commonFontStyle }}>
              {totalSecondsOnly}s
            </span>
          </div>
        </div>

        {/* ✅ 수정된 부분: 퍼즈/리플레이 버튼 - 모두 MIMOSA 색상으로 통일 */}
        <button
          onClick={isRunning ? onPause : onResume}
          aria-label={isRunning ? "일시정지" : "다시시작"}
          style={{
            width: 20,
            height: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {isRunning 
            ? <PauseIcon style={{ color: "var(--MIMOSA)" }} width="20" height="20" />
            : <ReplayIcon style={{ color: "var(--MIMOSA)" }} width="20" height="20" />
          }
        </button>

        {/* ✅ 정원 버튼들 - 직사각형의 가로 너비를 지름으로 사용 */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}>
          <button
            onClick={onComplete}
            style={{
              width: 32, // 원래 버튼의 대략적인 가로 너비
              height: 32, // width와 동일하게 설정하여 정원 생성
              background: "var(--bg-secondary)",
              border: "none",
              borderRadius: "50%", // 정원을 만드는 핵심
              fontSize: 12,
              color: "var(--text-primary)",
              lineHeight: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...commonFontStyle
            }}
          >
            피퇴
          </button>
          <button
            onClick={onEdit}
            style={{
              width: 32, // 원래 버튼의 대략적인 가로 너비
              height: 32, // width와 동일하게 설정하여 정원 생성
              background: "var(--bg-secondary)",
              border: "none",
              borderRadius: "50%", // 정원을 만드는 핵심
              fontSize: 12,
              color: "var(--text-primary)",
              lineHeight: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...commonFontStyle
            }}
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
}