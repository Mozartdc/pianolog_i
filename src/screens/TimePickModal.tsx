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
  // ✅ 수정: 타임스탬프 기반으로 변경
  onSave: (startTimestamp: number, endTimestamp: number) => void;

  // ✅ 수정: 실제 시작/종료 시간을 timestamp로 받기
  actualStartTime: number | null;
  actualEndTime: number | null;
  // 기존 props들
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

  // 숨겨진 input refs
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // ✅ 수정: 모달이 열릴 때만 초기값 설정 (의존성에서 actualStartTime, actualEndTime 제거)
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
  }, [isOpen]); // ✅ actualStartTime, actualEndTime 의존성 제거로 사용자 입력 후 리셋 방지

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const,
  };

  // ✅ 브라우저 호환성 개선된 타임픽커 트리거 함수
  const triggerTimePicker = (inputRef: React.RefObject<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    try {
      // Safari 호환성을 위해 focus 먼저
      input.focus();
      
      // 약간의 지연 후 showPicker 호출 (Safari 안정성 향상)
      setTimeout(() => {
        try {
          if (input.showPicker) {
            input.showPicker();
          } else {
            // fallback: click 이벤트
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

  // ✅ 개선된 시간 변경 핸들러 (Safari 호환성 향상)
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

  // ✅ 개선된 시간 변경 핸들러 (Safari 호환성 향상)
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

  // ✅ 통합 유틸리티를 사용한 저장 핸들러
  const handleSave = () => {
    const startTimestamp = startTime.valueOf();
    const endTimestamp = endTime.valueOf();

    // ✅ 통합 유효성 검사 사용
    const validation = validateTimeSettings(startTimestamp, endTimestamp);
    
    if (!validation.isValid) {
      setError(validation.error || "알 수 없는 오류가 발생했습니다.");
      return;
    }

    // ✅ 디버깅 로그
    logTimeInfo('TimePickModal 저장', startTimestamp, endTimestamp);
    
    // ✅ 타임스탬프로 전달
    onSave(startTimestamp, endTimestamp);

    // 피퇴 모달에서 온 경우 피퇴 모달로 돌아가기
    if (fromStopModal && onReturnToStopModal) {
      onReturnToStopModal();
    } else {
      // 일반적인 경우 모달 닫기
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

        {/* ✅ 피출 시간 - 행간 두배로 늘림 */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 32, // 16에서 32로 늘림
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
          
          {/* 편집 아이콘 + 숨겨진 input */}
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

        {/* ✅ 피퇴 시간 - 행간 두배로 늘림 */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 32, // 16에서 32로 늘림
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
          
          {/* 편집 아이콘 + 숨겨진 input */}
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

        {/* ✅ 총 연습 시간 - 행간 두배로 늘림 */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12, 
          marginBottom: 32, // 20에서 32로 늘림
          lineHeight: "100%"
        }}>
          <TotalIcon width="20" height="20" style={{ color: "var(--DARK_GRAY)" }} />
          <span style={{ fontSize: 16, color: "var(--text-primary)" }}>총 연습시간</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--TURQUOISE)" }}>
            {formatDuration(endTime.diff(startTime, 'minute'))}
          </span>
        </div>

        {/* ✅ 에러 메시지 */}
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

        {/* ✅ 저장/취소 버튼 - HomeStopModal과 동일한 크기/간격 */}
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