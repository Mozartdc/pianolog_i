import React from "react";
import MetronomIcon from "../assets/icons/metronom.svg";
import PauseIcon from "../assets/icons/pause.svg";
import ReplayIcon from "../assets/icons/replay.svg";

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
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-end",
      paddingBottom: 100,
      zIndex: 100,
      pointerEvents: "none"
    }}>
      <div style={{
        width: "100%",
        height: 97,
        background: "#ffffff",
        border: "0.5px solid #45b5aa",
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
          <img src={MetronomIcon} alt="metronom" width="20" height="20" />
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
            color: "#bb2649",
            lineHeight: "20px",
            ...commonFontStyle
          }}>
            {isRunning ? "피출중" : "피 휴"}
          </span>
          
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4
          }}>
            {hours > 0 && (
              <>
                <span style={{
                  fontSize: 32,
                  color: "#2d2d2a",
                  lineHeight: "32px",
                  ...commonFontStyle
                }}>
                  {hours}
                </span>
                <span style={{
                  fontSize: 20,
                  color: "#2d2d2a",
                  lineHeight: "32px",
                  ...commonFontStyle
                }}>
                  h
                </span>
              </>
            )}
            
            <span style={{
              fontSize: 32,
              color: "#2d2d2a",
              lineHeight: "32px",
              ...commonFontStyle
            }}>
              {minutes}
            </span>
            <span style={{
              fontSize: 20,
              color: "#2d2d2a",
              lineHeight: "32px",
              ...commonFontStyle
            }}>
              m
            </span>
            
            <span style={{
              fontSize: 14,
              color: "#2d2d2a",
              lineHeight: "20px",
              ...commonFontStyle
            }}>
              {seconds}s
            </span>
          </div>
        </div>

        {/* 퍼즈/리플레이 버튼 */}
        <button
          onClick={isRunning ? onPause : onResume}
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
          <img 
            src={isRunning ? PauseIcon : ReplayIcon} 
            alt={isRunning ? "pause" : "replay"} 
            width="20" 
            height="20" 
          />
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
              background: "#c7e6df",
              border: "none",
              borderRadius: 6,
              padding: "5px 8px",
              fontSize: 12,
              color: "#2d2d2a",
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
              background: "#c7e6df",
              border: "none",
              borderRadius: 6,
              padding: "5px 8px",
              fontSize: 12,
              color: "#2d2d2a",
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