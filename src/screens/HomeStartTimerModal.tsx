import React, { useRef, useEffect } from "react";
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import PauseIcon from "../assets/icons/pause.svg?react";
import ReplayIcon from "../assets/icons/replay.svg?react";
import playpianoAnimation from "../assets/Playpiano.json";

interface HomeStartTimerModalProps {
  timerSeconds: number;
  timerMilliseconds: number; // Added
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onEdit: () => void;
}

export function HomeStartTimerModal({
  timerSeconds,
  timerMilliseconds, // Added
  isRunning,
  onPause,
  onResume,
  onComplete,
  onEdit
}: HomeStartTimerModalProps) {
  const totalMs = timerMilliseconds; // Use value received from HomeScreen
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const totalSecondsOnly = Math.floor((totalMs % 60000) / 1000);
  const centiseconds = Math.floor((totalMs % 1000) / 10);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Control animation when paused
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
        {/* Lottie piano animation */}
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

        {/* Center status and time display */}
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

        {/* Modified: Pause/Replay button - unified with MIMOSA color */}
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

        {/* Circle buttons - use rectangle width as diameter */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}>
          <button
            onClick={onComplete}
            style={{
              width: 32, // Approximate width of original button
              height: 32, // Set equal to width to create perfect circle
              background: "var(--bg-secondary)",
              border: "none",
              borderRadius: "50%", // Key to creating circle
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
              width: 32, // Approximate width of original button
              height: 32, // Set equal to width to create perfect circle
              background: "var(--bg-secondary)",
              border: "none",
              borderRadius: "50%", // Key to creating circle
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