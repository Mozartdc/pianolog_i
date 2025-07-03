import React, { useState, useEffect } from "react";
import EndingNoteIcon from "../assets/icons/endingnote.svg";
import CloseIcon from "../assets/icons/close.svg";

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

  // ✅ timerState에서 메모 불러오기
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

  // ✅ 메모 변경 시 timerState에 실시간 저장
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
    fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const handleComplete = () => {
    // ✅ timerState에 메모가 이미 저장되어 있으므로 추가 저장 불필요
    // HomeScreen의 handlePracticeComplete에서 처리됨
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
        padding: "40px 20px", // ✅ 상하 여백 증가
        WebkitBackfaceVisibility: "hidden", // ✅ iOS 최적화
        transform: "translateZ(0)" // ✅ 하드웨어 가속
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-primary)", // ✅ CSS 변수 적용
          borderRadius: 8, // ✅ CSS 변수 대신 고정값 8px 사용 (선명도 개선)
          width: "100%", // ✅ 반응형으로 변경
          maxWidth: 345,
          height: "auto", // ✅ 320px → auto로 변경 (잘림 해결)
          minHeight: 320,  // ✅ 최소 높이만 보장
          maxHeight: "80vh", // ✅ 여유 공간 확보
          boxShadow: "var(--shadow-medium)", // ✅ CSS 변수 적용
          display: "flex",
          flexDirection: "column",
          padding: "32px 20px 20px 20px", // ✅ 상단 패딩 증가
          boxSizing: "border-box", // ✅ 박스 사이징 추가
          position: "relative", // ✅ X 버튼 위치를 위해 추가
          overflowY: "auto", // ✅ 내용이 넘치면 스크롤
          border: "1px solid rgba(0, 0, 0, 0.1)", // ✅ 명확한 테두리 추가
          transform: "translateZ(0)", // ✅ 하드웨어 가속으로 선명도 개선
          WebkitBackfaceVisibility: "hidden", // ✅ iOS Safari 렌더링 최적화
          ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 우측 상단 X 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16, // ✅ 아래로 이동
            right: 16, // ✅ 안쪽으로 이동
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
          <img src={CloseIcon} alt="close" width="20" height="20" />
        </button>

        {/* 제목 + 아이콘 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
          marginTop: 4, // ✅ 위쪽 여백 줄임
          ...commonFontStyle
        }}>
          <img 
            src={EndingNoteIcon} 
            alt="ending note" 
            width="24" 
            height="24"
          />
          <span style={{
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)" // ✅ CSS 변수 적용
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
              border: "var(--border-light)", // ✅ CSS 변수 적용
              borderRadius: "var(--border-radius-medium)", // ✅ CSS 변수 적용
              padding: 16,
              fontSize: 16, // ✅ 14px → 16px (iOS 확대 버그 해결)
              color: "var(--text-primary)", // ✅ CSS 변수 적용
              background: "var(--bg-primary)", // ✅ CSS 변수 적용
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
              borderRadius: "var(--border-radius-small)", // ✅ CSS 변수 적용
              border: "none",
              background: "var(--VERY_PERI)", // ✅ CSS 변수 적용
              color: "var(--WHITE)", // ✅ CSS 변수 적용
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--transition-fast)", // ✅ CSS 변수 적용
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
              borderRadius: "var(--border-radius-small)", // ✅ CSS 변수 적용
              border: "none",
              background: "var(--text-secondary)", // ✅ CSS 변수 적용
              color: "var(--WHITE)", // ✅ CSS 변수 적용
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--transition-fast)", // ✅ CSS 변수 적용
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
