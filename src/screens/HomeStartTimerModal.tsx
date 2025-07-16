import React from "react";
import MetronomIcon from "../assets/icons/metronom.svg?react";
import PauseIcon from "../assets/icons/pause.svg?react";
import ReplayIcon from "../assets/icons/replay.svg?react";

interface HomeStartTimerModalProps {
  timerSeconds: number;
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onEdit: () => void;
}

export function HomeStartTimerModal({
  timerSeconds,
  isRunning,
  onPause,
  onResume,
  onComplete,
  onEdit
}: HomeStartTimerModalProps) {
  const hours = Math.floor(timerSeconds / 3600);
  const minutes = Math.floor((timerSeconds % 3600) / 60);
  const seconds = timerSeconds % 60;

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
        {/* 메트로놈 아이콘 */}
        <button
          aria-label="메트로놈"
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
          {/* ✅ [수정] alt 속성 제거 */}
          <MetronomIcon style={{ color: "var(--TURQUOISE)" }} width="20" height="20" />
        </button>

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
              {seconds}s
            </span>
          </div>
        </div>

        {/* 퍼즈/리플레이 버튼 */}
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
          {/* ✅ [수정] alt 속성 제거 */}
          {isRunning 
            ? <PauseIcon style={{ color: "var(--text-primary)" }} width="20" height="20" />
            : <ReplayIcon style={{ color: "var(--MIMOSA)" }} width="20" height="20" />
          }
        </button>

        {/* 액션 버튼들 */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}>
          <button
            onClick={onComplete}
            style={{
              background: "var(--bg-secondary)",
              border: "none",
              borderRadius: 6,
              padding: "5px 8px",
              fontSize: 12,
              color: "var(--text-primary)",
              lineHeight: "14px",
              cursor: "pointer",
              ...commonFontStyle
            }}
          >
            피퇴
          </button>
          <button
            onClick={onEdit}
            style={{
              background: "var(--bg-secondary)",
              border: "none",
              borderRadius: 6,
              padding: "5px 8px",
              fontSize: 12,
              color: "var(--text-primary)",
              lineHeight: "14px",
              cursor: "pointer",
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