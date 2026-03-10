import { useState, useEffect, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import DateIcon from "../assets/icons/date.svg?react";
import DateEndIcon from "../assets/icons/dateend.svg?react";
import TimeEditIcon from "../assets/icons/timeedit.svg?react";
import TotalIcon from "../assets/icons/total.svg?react";
import Save2Icon from "../assets/icons/save2.svg?react";
import CancelIcon from "../assets/icons/cancel.svg?react";
import EraserIcon from "../assets/icons/eraser.svg?react";
import { validateTimeSettings, logTimeInfo, formatDuration } from "../utils/timeValidation";

interface TimePickModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Modified: Changed to timestamp-based
  onSave: (startTimestamp: number, endTimestamp: number) => void;

  // Modified: Receive actual start/end time as timestamp
  actualStartTime: number | null;
  actualEndTime: number | null;
  // Existing props
  fromStopModal?: boolean;
  onReturnToStopModal?: () => void;
}

export function TimePickModal({ 
  isOpen, 
  onClose, 
  onSave, 
  actualStartTime,
  actualEndTime,
  fromStopModal = false,
  onReturnToStopModal
}: TimePickModalProps) {
  const [startTime, setStartTime] = useState<Dayjs>(dayjs());
  const [endTime, setEndTime] = useState<Dayjs>(dayjs());
  const [error, setError] = useState("");

  // Hidden input refs
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // Modified: Set initial values only when modal opens (removed actualStartTime, actualEndTime from dependencies)
  useEffect(() => {
    if (isOpen && actualStartTime && actualEndTime) {
      const initialStartMoment = dayjs(actualStartTime);
      const initialEndMoment = dayjs(actualEndTime);
      
      console.log('TimePickModal 초기값 설정:', {
        actualStartTime,
        actualEndTime,
        startFormatted: initialStartMoment.format('YYYY-MM-DD HH:mm'),
        endFormatted: initialEndMoment.format('YYYY-MM-DD HH:mm')
      });
      
      setStartTime(initialStartMoment);
      setEndTime(initialEndMoment);
      setError("");
    }
  }, [isOpen]); // Removed actualStartTime, actualEndTime dependencies to prevent reset after user input

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  // Improved browser compatibility time picker trigger function
  const triggerTimePicker = (inputRef: React.RefObject<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    try {
      // Focus first for Safari compatibility
      input.focus();
      
      // Call showPicker after slight delay (improves Safari stability)
      setTimeout(() => {
        try {
          if (input.showPicker) {
            input.showPicker();
          } else {
            // fallback: click event
            input.click();
          }
        } catch (error) {
          console.log('showPicker 실패, click으로 대체:', error);
          input.click();
        }
      }, 100);
    } catch (error) {
      console.error('타임픽커 호출 실패:', error);
    }
  };

  // Improved time change handler (enhanced Safari compatibility)
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('피출 시간 변경:', value);
    
    if (value) {
      try {
        const newStartTime = dayjs(value);
        if (newStartTime.isValid()) {
          setStartTime(newStartTime);
          setError("");
          console.log('피출 시간 업데이트:', newStartTime.format('YYYY-MM-DD HH:mm'));
        } else {
          console.error('유효하지 않은 피출 시간:', value);
        }
      } catch (error) {
        console.error('피출 시간 파싱 오류:', error);
      }
    }
  };

  // Improved time change handler (enhanced Safari compatibility)
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('피퇴 시간 변경:', value);
    
    if (value) {
      try {
        const newEndTime = dayjs(value);
        if (newEndTime.isValid()) {
          setEndTime(newEndTime);
          setError("");
          console.log('피퇴 시간 업데이트:', newEndTime.format('YYYY-MM-DD HH:mm'));
        } else {
          console.error('유효하지 않은 피퇴 시간:', value);
        }
      } catch (error) {
        console.error('피퇴 시간 파싱 오류:', error);
      }
    }
  };

  // Save handler using integrated utility
  const handleSave = () => {
    const startTimestamp = startTime.valueOf();
    const endTimestamp = endTime.valueOf();

    // Use integrated validation
    const validation = validateTimeSettings(startTimestamp, endTimestamp);
    
    if (!validation.isValid) {
      setError(validation.error || "알 수 없는 오류가 발생했습니다.");
      return;
    }

    // Debug logging
    logTimeInfo('TimePickModal 저장', startTimestamp, endTimestamp);
    
    // Pass as timestamp
    onSave(startTimestamp, endTimestamp);

    // Return to stop modal if coming from there
    if (fromStopModal && onReturnToStopModal) {
      onReturnToStopModal();
    } else {
      // Close modal in normal case
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--modal-backdrop-home)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "40px 0px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 8,
          width: "100%-32px",
          minHeight: 320, maxHeight: "80vh",
          boxShadow: "var(--shadow-medium)",
          display: "flex", flexDirection: "column",
          padding: "32px 20px 20px 20px",
          boxSizing: "border-box", position: "relative",
          overflowY: "auto", border: "var(--modal-border)",
          ...commonFontStyle,
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ 
          fontSize: 20, 
          fontWeight: 600, 
          textAlign: "center", 
          marginBottom: 24,
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "var(--text-primary)"
        }}>
          <EraserIcon width="24" height="24" style={{ color: "var(--TURQUOISE)" }} />
          연습시간 수정
        </h3>

        {/* Start time - doubled line spacing */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 32, // increased from 16 to 32
          lineHeight: "100%",
          position: "relative" 
        }}>
          <DateEndIcon width="20" height="20" style={{ color: "var(--DARK_GRAY)" }} />
          <span style={{ fontSize: 16, color: "var(--text-primary)" }}>피출시간</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
            {startTime.format("HH:mm")}
          </span>
          <span style={{ fontSize: 16, color: "var(--text-secondary)" }}>
            {startTime.format("YY.MM.DD")}
          </span>
          
          {/* Edit icon + hidden input */}
          <div 
            style={{ 
              marginLeft: "auto", 
              position: "relative",
              cursor: "pointer" 
            }}
            onClick={() => triggerTimePicker(startInputRef)}
          >
            <TimeEditIcon 
              width="20" 
              height="20" 
              style={{ color: "var(--TURQUOISE)" }} 
            />
            
            <input
              ref={startInputRef}
              type="datetime-local"
              value={startTime.format('YYYY-MM-DDTHH:mm')}
              onChange={handleStartTimeChange}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0.01,
                cursor: "pointer",
                pointerEvents: "auto"
              }}
            />
          </div>
        </div>

        {/* End time - doubled line spacing */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 32, // increased from 16 to 32
          lineHeight: "100%",
          position: "relative" 
        }}>
          <DateIcon width="20" height="20" style={{ color: "var(--DARK_GRAY)" }} />
          <span style={{ fontSize: 16, color: "var(--text-primary)" }}>피퇴시간</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
            {endTime.format("HH:mm")}
          </span>
          <span style={{ fontSize: 16, color: "var(--text-secondary)" }}>
            {endTime.format("YY.MM.DD")}
          </span>
          
          {/* Edit icon + hidden input */}
          <div 
            style={{ 
              marginLeft: "auto", 
              position: "relative",
              cursor: "pointer" 
            }}
            onClick={() => triggerTimePicker(endInputRef)}
          >
            <TimeEditIcon 
              width="20" 
              height="20" 
              style={{ color: "var(--TURQUOISE)" }} 
            />
            
            <input
              ref={endInputRef}
              type="datetime-local"
              value={endTime.format('YYYY-MM-DDTHH:mm')}
              onChange={handleEndTimeChange}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0.01,
                cursor: "pointer",
                pointerEvents: "auto"
              }}
            />
          </div>
        </div>

        {/* Total practice time - doubled line spacing */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 32, // increased from 20 to 32
          lineHeight: "100%"
        }}>
          <TotalIcon width="20" height="20" style={{ color: "var(--DARK_GRAY)" }} />
          <span style={{ fontSize: 16, color: "var(--text-primary)" }}>총 연습시간</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--TURQUOISE)" }}>
            {formatDuration(endTime.diff(startTime, 'minute'))}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ 
            color: "var(--error-color)", 
            fontSize: 12, 
            textAlign: "center", 
            marginBottom: 16, 
            padding: 8, 
            background: "var(--error-bg)", 
            borderRadius: 8 
          }}>
            {error}
          </div>
        )}

        {/* Save/Cancel buttons - same size/spacing as HomeStopModal */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 20 }}>
          <button
            onClick={handleSave}
            disabled={!!error}
            style={{
              width: 140, height: 35,
              background: "none", border: "none",
              borderRadius: "var(--border-radius-small)",
              cursor: error ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, opacity: error ? 0.5 : 1,
              color: "var(--VIVA_MAGENTA)", ...commonFontStyle,
            }}
          >
            <Save2Icon 
              width="16" 
              height="16" 
              style={{ color: "currentColor" }}
            />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {fromStopModal ? "수정 완료" : "저장"}
            </span>
          </button>
          
          <button
            onClick={onClose}
            style={{
              width: 140, height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none", background: "transparent",
              fontSize: 16, fontWeight: 600,
              cursor: "pointer",
              transition: "color 0.2s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, ...commonFontStyle,
              color: "var(--BLACK)",
            }}
          >
            <CancelIcon 
              width="16" 
              height="16" 
              style={{ color: "currentColor" }}
            />
            <span style={{ color: "currentColor" }}>취소</span>
          </button>
        </div>
      </div>
    </div>
  );
}