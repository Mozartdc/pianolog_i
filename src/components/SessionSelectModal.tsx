import React, { useState } from "react";
import HistoryIcon from "../assets/icons/History.svg";

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
        background: "#fff",
        borderRadius: 8,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxHeight: "80vh",
        overflowY: "auto"
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#2D2D2A",
          textAlign: "center",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
        }}>
          공유할 피출 기록을 선택해주세요.
        </div>
        
        <div style={{
          fontSize: 12,
          color: "#9E9C98",
          textAlign: "center",
          fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
        }}>
          오늘 날짜의 피출기록만 선택 가능합니다.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map((session, index) => {
            const startTime = new Date(session.startTime).toLocaleTimeString('ko-KR', { 
              hour: '2-digit', minute: '2-digit' 
            });
            const endTime = new Date(session.endTime).toLocaleTimeString('ko-KR', { 
              hour: '2-digit', minute: '2-digit' 
            });
            const duration = `${Math.floor(session.practiceTime / 60)}시간 ${session.practiceTime % 60}분`;
            const timeRange = `${startTime}~${endTime}`;
            const isSelected = selectedSessionId === session.id;
            
            return (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                style={{
                  width: "100%",
                  height: 32,
                  padding: "6px 10px",
                  border: `0.5px solid ${isSelected ? "#6667AB" : "#F0EAD6"}`,
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: isSelected ? "#F8F8F8" : "#ffffff",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  position: 'relative'
                }}
              >
                <img src={HistoryIcon} alt="history" width="16" height="16" />
                <div style={{
                  fontSize: 14,
                  color: "#2D2D2A",
                  flex: 1,
                  overflow: "hidden",
                  fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis"
                }}>
                  <span style={{ fontSize: 12, color: "#9E9C98" }}>
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
              color: "#9E9C98",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirmClick}
            style={{
              width: 137,
              height: 43,
              background: "#6667AB",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif"
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
