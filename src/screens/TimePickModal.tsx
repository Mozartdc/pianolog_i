import { useState, useEffect } from "react";
import dayjs from "dayjs";
import TimeUpIcon from "../assets/icons/timeup.svg";
import TimeDownIcon from "../assets/icons/timedown.svg";

interface TimePickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => void;
  currentDuration: number; // 현재 타이머 시간 (초)
}

export function TimePickModal({ isOpen, onClose, onSave, currentDuration }: TimePickModalProps) {
  const now = dayjs();
  
  // 현재 시간을 기준으로 기본값 설정
  const [endTime, setEndTime] = useState({
    hour: now.hour(),
    minute: now.minute()
  });
  
  const [startTime, setStartTime] = useState({
    hour: now.subtract(Math.floor(currentDuration / 60), 'minute').hour(),
    minute: now.subtract(Math.floor(currentDuration / 60), 'minute').minute()
  });

  const [error, setError] = useState("");

  // 핵심 수정: currentDuration을 의존성에서 제거
  useEffect(() => {
    if (isOpen) {
      const currentTime = dayjs();
      const newEndTime = {
        hour: currentTime.hour(),
        minute: currentTime.minute()
      };
      const newStartTime = {
        hour: currentTime.subtract(Math.floor(currentDuration / 60), 'minute').hour(),
        minute: currentTime.subtract(Math.floor(currentDuration / 60), 'minute').minute()
      };
      
      setEndTime(newEndTime);
      setStartTime(newStartTime);
      setError("");
    }
  }, [isOpen]); // currentDuration 제거!

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // 시간 조정 함수 - 검증 없이 상태만 변경
  const adjustTime = (type: 'start' | 'end', field: 'hour' | 'minute', direction: 'up' | 'down') => {
    if (type === 'start') {
      setStartTime(prev => {
        const newStartTime = { ...prev };
        
        if (field === 'hour') {
          newStartTime.hour = direction === 'up' 
            ? Math.min(23, prev.hour + 1)
            : Math.max(0, prev.hour - 1);
        } else {
          newStartTime.minute = direction === 'up'
            ? Math.min(59, prev.minute + 1)
            : Math.max(0, prev.minute - 1);
        }
        
        return newStartTime;
      });
    } else {
      setEndTime(prev => {
        const newEndTime = { ...prev };
        
        if (field === 'hour') {
          newEndTime.hour = direction === 'up'
            ? Math.min(23, prev.hour + 1)
            : Math.max(0, prev.hour - 1);
        } else {
          newEndTime.minute = direction === 'up'
            ? Math.min(59, prev.minute + 1)
            : Math.max(0, prev.minute - 1);
        }
        
        return newEndTime;
      });
    }
    setError(""); // 에러 초기화
  };

  // 저장 시에만 검증
  const handleSave = () => {
    const currentTime = dayjs();
    const startDateTime = currentTime.hour(startTime.hour).minute(startTime.minute);
    const endDateTime = currentTime.hour(endTime.hour).minute(endTime.minute);
    
    // 최종 검증
    if (startDateTime.isAfter(currentTime)) {
      setError("피출 시간은 현재 시간보다 이전이어야 합니다");
      return;
    }
    
    if (endDateTime.isAfter(currentTime)) {
      setError("피퇴 시간은 현재 시간보다 이전이어야 합니다");
      return;
    }
    
    if (endDateTime.isBefore(startDateTime)) {
      setError("피퇴 시간은 피출 시간보다 나중이어야 합니다");
      return;
    }
    
    onSave(
      startDateTime.format("HH:mm"),
      endDateTime.format("HH:mm")
    );
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center", // 세로 중앙 정렬
        justifyContent: "center", // 가로 중앙 정렬
        zIndex: 1000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "absolute",
          left: 15, // HomeStartTimerModal과 동일한 위치
          background: "#ffffff",
          borderRadius: 20,
          padding: 24,
          width: 345, // HomeStartTimerModal과 동일한 너비
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          maxHeight: "80vh", // 화면 높이의 80%를 넘지 않음
          overflow: "auto", // 내용이 많으면 스크롤
          ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          textAlign: "center", 
          marginBottom: 24,
          color: "#2d2d2a"
        }}>
          연습 시간 수정
        </h3>

        {/* 피출/피퇴 시간 좌우 배치 */}
        <div style={{
          display: "flex",
          gap: 24,
          marginBottom: 24
        }}>
          {/* 피출 시간 (왼쪽) */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: 14, 
              color: "#9e9c98", 
              marginBottom: 16,
              textAlign: "center"
            }}>
              피출 시간
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12
            }}>
              {/* 시간 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => adjustTime('start', 'hour', 'up')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeUpIcon} alt="time up" width="16" height="16" />
                </button>
                <span style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  color: "#2d2d2a",
                  minWidth: 30,
                  textAlign: "center"
                }}>
                  {String(startTime.hour).padStart(2, '0')}
                </span>
                <button
                  onClick={() => adjustTime('start', 'hour', 'down')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeDownIcon} alt="time down" width="16" height="16" />
                </button>
              </div>
              
              <span style={{ fontSize: 20, color: "#2d2d2a" }}>:</span>
              
              {/* 분 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => adjustTime('start', 'minute', 'up')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeUpIcon} alt="time up" width="16" height="16" />
                </button>
                <span style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  color: "#2d2d2a",
                  minWidth: 30,
                  textAlign: "center"
                }}>
                  {String(startTime.minute).padStart(2, '0')}
                </span>
                <button
                  onClick={() => adjustTime('start', 'minute', 'down')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeDownIcon} alt="time down" width="16" height="16" />
                </button>
              </div>
            </div>
          </div>

          {/* 피퇴 시간 (오른쪽) */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: 14, 
              color: "#9e9c98", 
              marginBottom: 16,
              textAlign: "center"
            }}>
              피퇴 시간
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12
            }}>
              {/* 시간 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => adjustTime('end', 'hour', 'up')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeUpIcon} alt="time up" width="16" height="16" />
                </button>
                <span style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  color: "#2d2d2a",
                  minWidth: 30,
                  textAlign: "center"
                }}>
                  {String(endTime.hour).padStart(2, '0')}
                </span>
                <button
                  onClick={() => adjustTime('end', 'hour', 'down')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeDownIcon} alt="time down" width="16" height="16" />
                </button>
              </div>
              
              <span style={{ fontSize: 20, color: "#2d2d2a" }}>:</span>
              
              {/* 분 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => adjustTime('end', 'minute', 'up')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeUpIcon} alt="time up" width="16" height="16" />
                </button>
                <span style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  color: "#2d2d2a",
                  minWidth: 30,
                  textAlign: "center"
                }}>
                  {String(endTime.minute).padStart(2, '0')}
                </span>
                <button
                  onClick={() => adjustTime('end', 'minute', 'down')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeDownIcon} alt="time down" width="16" height="16" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 연습 시간 표시 */}
        <div style={{
          background: "#f9f9f9",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 12, color: "#9e9c98", marginBottom: 4 }}>
            총 연습 시간
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#45b5aa" }}>
            {(() => {
              const currentTime = dayjs();
              const start = currentTime.hour(startTime.hour).minute(startTime.minute);
              const end = currentTime.hour(endTime.hour).minute(endTime.minute);
              const duration = end.diff(start, 'minute');
              const hours = Math.floor(duration / 60);
              const minutes = duration % 60;
              return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
            })()}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            color: "#bb2649",
            fontSize: 12,
            textAlign: "center",
            marginBottom: 16,
            padding: 8,
            background: "#ffeaea",
            borderRadius: 8
          }}>
            {error}
          </div>
        )}

        {/* 버튼들 */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={!!error}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: 12,
              border: "none",
              background: error ? "#9e9c98" : "#45b5aa",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: error ? "not-allowed" : "pointer",
              ...commonFontStyle
            }}
          >
            저장
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: 12,
              border: "none",
              background: "#9e9c98",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              ...commonFontStyle
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
