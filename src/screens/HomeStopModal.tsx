import { useState } from "react";
import EndingNoteIcon from "../assets/icons/endingnote.svg";
import CloseIcon from "../assets/icons/close.svg";

interface HomeStopModalProps {
  isOpen: boolean;
  practiceTime: string; // "99시간 99분" 형태
  onComplete: () => void; // 피퇴 - 홈스크린으로 돌아가기
  onEditTime: () => void; // 시간 수정 - TimePickModal 열기
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

  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const handleComplete = () => {
    // 연습 노트 저장 (필요시)
    if (practiceNote.trim()) {
      const today = new Date().toISOString().slice(0, 10);
      const savedNotes = localStorage.getItem("practiceNotes") || "{}";
      const notes = JSON.parse(savedNotes);
      notes[today] = practiceNote.trim();
      localStorage.setItem("practiceNotes", JSON.stringify(notes));
    }
    
    onComplete(); // 홈스크린으로 돌아가기
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
        background: "rgba(45, 45, 42, 0.2)", // #2D2D2A 20% 투명도
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
          borderRadius: 4, // PDF에서 4px 둥근 모서리
          width: 345, // PDF 사양: 345px
          height: 320, // 높이를 늘려서 내용이 넘치지 않도록
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 20px 20px 20px",
          ...commonFontStyle
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 우측 상단 X 버튼 - close.svg 아이콘 사용 (색상 지정 제거) */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 20,
            height: 20,
            background: "none", // 배경 제거
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

        {/* 제목 + 아이콘 (한 줄에 배치) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8, // 아이콘과 텍스트 간격
          marginBottom: 24,
          marginTop: 8, // X 버튼과의 간격을 위해 약간의 상단 여백 추가
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
            color: "#2d2d2a"
          }}>
            오늘 {practiceTime} 연습
          </span>
        </div>

        {/* 연습 노트 입력 - 높이 150으로 고정 */}
        <div style={{
          marginBottom: 20
        }}>
          <textarea
            value={practiceNote}
            onChange={(e) => setPracticeNote(e.target.value)}
            placeholder="오늘의 연습 노트를 작성해보세요..."
            style={{
              width: "100%",
              height: 150, // 높이 150px로 고정
              border: "1px solid #c4c3d0", // Lavender Gray
              borderRadius: 8,
              padding: 16,
              fontSize: 14,
              color: "#2d2d2a",
              background: "#ffffff",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              ...commonFontStyle
            }}
          />
        </div>

        {/* 버튼들 - 좌우 끝에 정렬 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between", // 좌우 끝에 정렬
          gap: 12
        }}>
          <button
            onClick={handleComplete}
            style={{
              width: 140, // 너비 140px
              height: 35, // 높이 35px
              borderRadius: 4, // 코너R 값 4
              border: "none",
              background: "#6667ab", // Very Peri
              color: "#ffffff", // 화이트 글자
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              ...commonFontStyle
            }}
          >
            피퇴
          </button>
          <button
            onClick={onEditTime}
            style={{
              width: 140, // 너비 140px
              height: 35, // 높이 35px
              borderRadius: 4, // 코너R 값 4
              border: "none",
              background: "#f3d6cb", // Pearl Blush
              color: "#ffffff", // 화이트 글자
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
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
