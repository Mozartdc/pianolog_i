import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
// ✅ [수정] 아이콘을 React 컴포넌트로 불러옵니다.
import TimeUpIcon from "../assets/icons/timeup.svg?react";
import TimeDownIcon from "../assets/icons/timedown.svg?react";

interface TimePickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => void;
  currentDuration: number;
  actualStartTime: number | null;
}

export function TimePickModal({ isOpen, onClose, onSave, currentDuration, actualStartTime }: TimePickModalProps) {
  const [startTime, setStartTime] = useState<Dayjs>(dayjs());
  const [endTime, setEndTime] = useState<Dayjs>(dayjs());
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      let initialStartMoment: Dayjs;
      let initialEndMoment: Dayjs;
      if (actualStartTime) {
        initialStartMoment = dayjs(actualStartTime);
        initialEndMoment = dayjs();
      } else {
        initialEndMoment = dayjs();
        initialStartMoment = dayjs().subtract(currentDuration, 'second');
      }
      setStartTime(initialStartMoment);
      setEndTime(initialEndMoment);
      setError("");
    }
  }, [isOpen]);

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const adjustTime = (type: 'start' | 'end', field: 'hour' | 'minute', direction: 'up' | 'down') => {
    setError("");
    const amount = direction === 'up' ? 1 : -1;
    const unit = field;
    if (type === 'start') {
      setStartTime(prev => prev.add(amount, unit));
    } else {
      setEndTime(prev => prev.add(amount, unit));
    }
  };

  const handleSave = () => {
    const nowMoment = dayjs();

    if (endTime.isBefore(startTime)) {
      setError("피퇴 시간은 피출 시간보다 나중이어야 합니다.");
      return;
    }
    if (endTime.diff(startTime, 'minute') <= 0) {
      setError("연습 시간은 1분 이상이어야 합니다.");
      return;
    }
    if (endTime.isAfter(nowMoment.add(1, 'minute'))) {
      setError("피퇴 시간은 현재 시간보다 이전이거나 같아야 합니다.");
      return;
    }
    if (startTime.isAfter(nowMoment.add(1, 'minute'))) {
        setError("피출 시간은 현재 시간보다 이전이거나 같아야 합니다.");
        return;
    }
    onSave(startTime.format("HH:mm"), endTime.format("HH:mm"));
  };

  if (!isOpen) return null;

  const iconButtonStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-secondary)" // ✅ 아이콘 색상을 버튼에 지정
  };

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)", color: "var(--text-primary)",
          borderRadius: 20, padding: 24, width: "90%", maxWidth: 345,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          maxHeight: "80vh", overflow: "auto",
          ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 24 }}>
          연습 시간 수정
        </h3>

        <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
          {/* 피출 시간 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, textAlign: "center" }}>
              피출 시간
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button onClick={() => adjustTime('start', 'hour', 'up')} style={iconButtonStyle}><TimeUpIcon width="16" height="16" /></button>
                <span style={{ fontSize: 20, fontWeight: 600, minWidth: 30, textAlign: "center" }}>{String(startTime.hour()).padStart(2, '0')}</span>
                <button onClick={() => adjustTime('start', 'hour', 'down')} style={iconButtonStyle}><TimeDownIcon width="16" height="16" /></button>
              </div>
              <span style={{ fontSize: 20 }}>:</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button onClick={() => adjustTime('start', 'minute', 'up')} style={iconButtonStyle}><TimeUpIcon width="16" height="16" /></button>
                <span style={{ fontSize: 20, fontWeight: 600, minWidth: 30, textAlign: "center" }}>{String(startTime.minute()).padStart(2, '0')}</span>
                <button onClick={() => adjustTime('start', 'minute', 'down')} style={iconButtonStyle}><TimeDownIcon width="16" height="16" /></button>
              </div>
            </div>
          </div>
          {/* 피퇴 시간 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, textAlign: "center" }}>
              피퇴 시간
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button onClick={() => adjustTime('end', 'hour', 'up')} style={iconButtonStyle}><TimeUpIcon width="16" height="16" /></button>
                <span style={{ fontSize: 20, fontWeight: 600, minWidth: 30, textAlign: "center" }}>{String(endTime.hour()).padStart(2, '0')}</span>
                <button onClick={() => adjustTime('end', 'hour', 'down')} style={iconButtonStyle}><TimeDownIcon width="16" height="16" /></button>
              </div>
              <span style={{ fontSize: 20 }}>:</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button onClick={() => adjustTime('end', 'minute', 'up')} style={iconButtonStyle}><TimeUpIcon width="16" height="16" /></button>
                <span style={{ fontSize: 20, fontWeight: 600, minWidth: 30, textAlign: "center" }}>{String(endTime.minute()).padStart(2, '0')}</span>
                <button onClick={() => adjustTime('end', 'minute', 'down')} style={iconButtonStyle}><TimeDownIcon width="16" height="16" /></button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--info-bg)", borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
            총 연습 시간
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--TURQUOISE)" }}>
            {(() => {
              let duration = endTime.diff(startTime, 'minute');
              if (duration < 0) duration += 24 * 60;
              const hours = Math.floor(duration / 60);
              const minutes = duration % 60;
              if (duration === 0) return "0분";
              return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
            })()}
          </div>
        </div>

        {error && (
          <div style={{ color: "var(--error-color)", fontSize: 12, textAlign: "center", marginBottom: 16, padding: 8, background: "var(--error-bg)", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={!!error}
            style={{
              flex: 1, padding: "14px 20px", borderRadius: 12, border: "none",
              background: error ? "var(--text-secondary)" : "var(--button-primary-bg)",
              color: "var(--button-primary-text)",
              fontSize: 14, fontWeight: 600,
              cursor: error ? "not-allowed" : "pointer",
              ...commonFontStyle
            }}
          >
            저장
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "14px 20px", borderRadius: 12, border: "none",
              background: "var(--text-secondary)",
              color: "var(--button-primary-text)",
              fontSize: 14, fontWeight: 600,
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