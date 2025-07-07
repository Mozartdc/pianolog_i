import React, { useState } from "react";
import HistoryIcon from "../assets/icons/History.svg?react"; // ✅ .svg?react로 임포트

interface PracticeRecord {
  id: string;
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  track?: string;
}

interface SessionSelectModalProps {
  isOpen: boolean;
  sessions: PracticeRecord[];
  onSelectSession: (session: PracticeRecord) => void;
  onClose: () => void;
}

const SessionSelectModal: React.FC<SessionSelectModalProps> = ({
  isOpen,
  sessions,
  onSelectSession,
  onClose
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSessionClick = (session: PracticeRecord) => {
    setSelectedSessionId(session.id);
  };

  const handleConfirmClick = () => {
    if (selectedSessionId) {
      const selectedSession = sessions.find(s => s.id === selectedSessionId);
      if (selectedSession) {
        onSelectSession(selectedSession);
        onClose();
      }
    } else {
      alert('세션을 선택해주세요.');
    }
  };
  
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)"
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        width: "100%",
        background: "var(--bg-primary)", // ✅ 수정
        color: "var(--text-primary)", // ✅ 기본 텍스트 색상
        borderRadius: 8,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxHeight: "80vh",
        overflowY: "auto",
        ...commonFontStyle
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          textAlign: "center",
        }}>
          공유할 피출 기록을 선택해주세요.
        </div>
        
        <div style={{
          fontSize: 12,
          color: "var(--text-secondary)", // ✅ 수정
          textAlign: "center",
        }}>
          오늘 날짜의 피출기록만 선택 가능합니다.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map((session, index) => {
            const startTime = new Date(session.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(session.endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            const duration = `${Math.floor(session.practiceTime / 60)}시간 ${session.practiceTime % 60}분`;
            const timeRange = `${startTime}~${endTime}`;
            const isSelected = selectedSessionId === session.id;
            
            return (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: `1px solid ${isSelected ? "var(--VERY_PERI)" : "var(--text-secondary)"}`, // ✅ 수정
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: isSelected ? "var(--bg-secondary)" : "var(--bg-primary)", // ✅ 수정
                  boxSizing: "border-box",
                  cursor: "pointer",
                  position: 'relative',
                  color: "var(--text-primary)" // ✅ 아이콘 색상 상속
                }}
              >
                <HistoryIcon style={{ width: 16, height: 16, flexShrink: 0, color: "var(--text-secondary)" }} />
                <div style={{
                  fontSize: 14,
                  flex: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis"
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    session {index + 1}.
                  </span>{" "}
                  {duration} ({timeRange})
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              width: 87,
              height: 43,
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)", // ✅ 수정
              fontSize: 14,
              cursor: "pointer",
              ...commonFontStyle
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirmClick}
            style={{
              width: 137,
              height: 43,
              background: "var(--VERY_PERI)", // ✅ 수정
              border: "none",
              borderRadius: 8,
              color: "var(--button-primary-text)", // ✅ 수정
              fontSize: 14,
              cursor: "pointer",
              ...commonFontStyle
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSelectModal;