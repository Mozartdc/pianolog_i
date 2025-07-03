import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs"; // Dayjs 타입 임포트
import TimeUpIcon from "../assets/icons/timeup.svg";
import TimeDownIcon from "../assets/icons/timedown.svg";

interface TimePickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => void;
  currentDuration: number; // 현재 타이머 시간 (초)
  actualStartTime: number | null; // 현재 타이머의 실제 시작 시간 (타임스탬프)
}

export function TimePickModal({ isOpen, onClose, onSave, currentDuration, actualStartTime }: TimePickModalProps) {
  const [startTime, setStartTime] = useState<Dayjs>(dayjs());
  const [endTime, setEndTime] = useState<Dayjs>(dayjs());
  const [error, setError] = useState("");

  // ✅ 핵심 수정: useEffect 훅의 의존성 배열에서 actualStartTime, currentDuration 제거
  // 모달이 열릴 때 (isOpen이 true가 될 때)만 초기화되도록 합니다.
  useEffect(() => {
    if (isOpen) {
      let initialStartMoment: Dayjs;
      let initialEndMoment: Dayjs;

      if (actualStartTime) {
        // 타이머가 시작된 경우, 실제 시작 시간과 현재 시간을 기준으로 설정
        initialStartMoment = dayjs(actualStartTime);
        initialEndMoment = dayjs(); // 모달이 열리는 현재 시각
      } else {
        // 타이머가 시작되지 않은 경우 (예: 초기 실행), 현재 시간을 기준으로 계산
        initialEndMoment = dayjs();
        initialStartMoment = dayjs().subtract(currentDuration, 'second');
      }
      
      console.log('TimePickModal: Modal opened or isOpen changed. Initializing times.');
      console.log('TimePickModal: Initial Start Time:', initialStartMoment.format('HH:mm:ss'));
      console.log('TimePickModal: Initial End Time:', initialEndMoment.format('HH:mm:ss'));

      setStartTime(initialStartMoment);
      setEndTime(initialEndMoment);
      setError("");
    }
  }, [isOpen]); // ✅ 변경된 부분: [isOpen] 만 남깁니다.

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const adjustTime = (type: 'start' | 'end', field: 'hour' | 'minute', direction: 'up' | 'down') => {
    setError(""); // 시간 조정 시 에러 메시지 초기화
    
    console.log(`TimePickModal: adjustTime called - Type: ${type}, Field: ${field}, Direction: ${direction}`);

    if (type === 'start') {
      setStartTime(prev => {
        const newTime = direction === 'up'
                        ? (field === 'hour' ? prev.add(1, 'hour') : prev.add(1, 'minute'))
                        : (field === 'hour' ? prev.subtract(1, 'hour') : prev.subtract(1, 'minute'));
        console.log(`TimePickModal: New Start Time Calculated (inside setStartTime): ${newTime.format('HH:mm:ss')}`);
        return newTime;
      });
    } else { // type === 'end'
      setEndTime(prev => {
        const newTime = direction === 'up'
                        ? (field === 'hour' ? prev.add(1, 'hour') : prev.add(1, 'minute'))
                        : (field === 'hour' ? prev.subtract(1, 'hour') : prev.subtract(1, 'minute'));
        console.log(`TimePickModal: New End Time Calculated (inside setEndTime): ${newTime.format('HH:mm:ss')}`);
        return newTime;
      });
    }
  };

  const handleSave = () => {
    const startDateTime = startTime;
    const endDateTime = endTime;
    
    const nowMoment = dayjs(); // 현재 시각 (검증용)

    console.log(`TimePickModal: handleSave called - Start: ${startDateTime.format('HH:mm:ss')}, End: ${endDateTime.format('HH:mm:ss')}`);

    if (endDateTime.isBefore(startDateTime)) {
      setError("피퇴 시간은 피출 시간보다 나중이어야 합니다.");
      console.log("TimePickModal Error: End time is before Start time.");
      return;
    }
    
    if (endDateTime.diff(startDateTime, 'minute') <= 0) {
      setError("연습 시간은 1분 이상이어야 합니다.");
      console.log("TimePickModal Error: Practice duration is 0 or less minutes.");
      return;
    }

    if (endDateTime.isAfter(nowMoment.add(1, 'minute'))) { // 1분 여유
      setError("피퇴 시간은 현재 시간보다 이전이거나 같아야 합니다.");
      console.log("TimePickModal Error: End time is in the future.");
      return;
    }
    
    if (startDateTime.isAfter(nowMoment.add(1, 'minute'))) { // 1분 여유
        setError("피출 시간은 현재 시간보다 이전이거나 같아야 합니다.");
        return;
    }

    console.log("TimePickModal: Validation passed. Calling onSave.");
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
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 24,
          width: "90%",
          maxWidth: 345,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          maxHeight: "80vh",
          overflow: "auto",
          ...commonFontStyle
        }}
        onClick={e => {
            e.stopPropagation();
            console.log("TimePickModal: Inner content clicked (stopPropagation).");
        }}
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

        <div style={{
          display: "flex",
          gap: 24,
          marginBottom: 24
        }}>
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
                  {String(startTime.hour()).padStart(2, '0')}
                </span>
                <button
                  onClick={() => adjustTime('start', 'hour', 'down')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeDownIcon} alt="time down" width="16" height="16" />
                </button>
              </div>
              
              <span style={{ fontSize: 20, color: "#2d2d2a" }}>:</span>
              
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
                  {String(startTime.minute()).padStart(2, '0')}
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
                  {String(endTime.hour()).padStart(2, '0')}
                </span>
                <button
                  onClick={() => adjustTime('end', 'hour', 'down')}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <img src={TimeDownIcon} alt="time down" width="16" height="16" />
                </button>
              </div>
              
              <span style={{ fontSize: 20, color: "#2d2d2a" }}>:</span>
              
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
                  {String(endTime.minute()).padStart(2, '0')}
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
              let duration = endTime.diff(startTime, 'minute');
              if (duration < 0) {
                duration += 24 * 60;
              }
              
              const hours = Math.floor(duration / 60);
              const minutes = duration % 60;
              
              if (duration === 0) return "0분"; 
              return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
            })()}
          </div>
        </div>

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