import React, { useState, useEffect } from "react";
// ✅ [수정] 아이콘을 React 컴포넌트로 불러옵니다.
import EndingNoteIcon from "../assets/icons/endingnote.svg?react";
import CloseIcon from "../assets/icons/close.svg?react";

interface HomeStopModalProps {
  isOpen: boolean;
  practiceTime: string;
  onComplete: () => void;
  onEditTime: () => void;
  onClose: () => void;
}

export function HomeStopModal({ 
  isOpen, 
  practiceTime, 
  onComplete, 
  onEditTime, 
  onClose 
}: HomeStopModalProps) {
  const [practiceNote, setPracticeNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        try {
          const { memo } = JSON.parse(timerState);
          setPracticeNote(memo || "");
        } catch (error) {
          console.error('메모 불러오기 실패:', error);
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const timerState = localStorage.getItem('timerState');
    if (timerState) {
      try {
        const parsed = JSON.parse(timerState);
        parsed.memo = practiceNote;
        localStorage.setItem('timerState', JSON.stringify(parsed));
      } catch (error) {
        console.error('메모 저장 실패:', error);
      }
    }
  }, [practiceNote]);

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const handleComplete = () => {
    onComplete();
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
        background: "rgba(45, 45, 42, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "40px 20px",
        WebkitBackfaceVisibility: "hidden",
        transform: "translateZ(0)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)",
          borderRadius: 8,
          width: "100%",
          maxWidth: 345,
          height: "auto",
          minHeight: 320,
          maxHeight: "80vh",
          boxShadow: "var(--shadow-medium)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 20px 20px 20px",
          boxSizing: "border-box",
          position: "relative",
          overflowY: "auto",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 우측 상단 X 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 20,
            height: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0
          }}
        >
          {/* ✅ [수정] <img>를 컴포넌트로 바꾸고 색상 지정 */}
          <CloseIcon style={{ color: "var(--text-secondary)" }} width="20" height="20" />
        </button>

        {/* 제목 + 아이콘 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
          marginTop: 4,
          ...commonFontStyle
        }}>
          {/* ✅ [수정] <img>를 컴포넌트로 바꾸고 색상 지정 */}
          <EndingNoteIcon 
            style={{ color: "var(--TURQUOISE)" }}
            width="24" 
            height="24"
          />
          <span style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)"
          }}>
            오늘 {practiceTime} 연습
          </span>
        </div>

        {/* 연습 노트 입력 */}
        <div style={{
          marginBottom: 20
        }}>
          <textarea
            value={practiceNote}
            onChange={(e) => setPracticeNote(e.target.value)}
            placeholder="오늘의 연습 노트를 작성해보세요..."
            style={{
              width: "100%",
              height: 150,
              border: "var(--border-light)",
              borderRadius: "var(--border-radius-medium)",
              padding: 16,
              fontSize: 16,
              color: "var(--text-primary)",
              background: "var(--bg-primary)",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              ...commonFontStyle
            }}
          />
        </div>

        {/* 버튼들 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12
        }}>
          <button
            onClick={handleComplete}
            style={{
              width: 140,
              height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none",
              background: "var(--TURQUOISE)",
              color: "var(--button-primary-text)", // ✅ --WHITE 대신 의미적 변수 사용
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--transition-fast)",
              ...commonFontStyle
            }}
          >
            피퇴
          </button>
          <button
            onClick={onEditTime}
            style={{
              width: 140,
              height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none",
              background: "var(--text-secondary)",
              color: "var(--text-primary)", // ✅ --WHITE 대신 의미적 변수 사용
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--transition-fast)",
              ...commonFontStyle
            }}
          >
            시간 수정
          </button>
        </div>
      </div>
    </div>
  );
}