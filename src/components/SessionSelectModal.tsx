import React, { useState } from "react";
import HistoryIcon from "../assets/icons/History.svg?react";
import ExportIcon from "../assets/icons/export.svg?react";
import type { PracticeRecord } from "../contexts/PracticeDataContext";

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
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--modal-backdrop-home)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        zIndex: 1000, 
        padding: "40px 0px",
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: "var(--bg-primary)",
          borderRadius: 8,
          width: "100%-32px",
          minHeight: 320, 
          maxHeight: "80vh",
          boxShadow: "var(--shadow-medium)",
          display: "flex", 
          flexDirection: "column",
          padding: "32px 20px 20px 20px",
          boxSizing: "border-box", 
          position: "relative",
          overflowY: "auto", 
          border: "var(--modal-border)",
          ...commonFontStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - consistent style with other modals */}
        <div style={{
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: 8, 
          marginBottom: 24, 
          marginTop: 4, 
          ...commonFontStyle,
        }}>
          <ExportIcon width={24} height={24} style={{ color: "var(--text-primary)" }} />
          <span style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: "var(--text-primary)" 
          }}>
            공유할 피출 기록 선택
          </span>
        </div>
        
        {/* Instruction text */}
        <div style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          textAlign: "center",
          marginBottom: 20,
          lineHeight: "16px",
          ...commonFontStyle
        }}>
          오늘 날짜의 피출기록만 선택 가능합니다.
        </div>

        {/* Session list */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 10,
          marginBottom: 20
        }}>
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
                  padding: "12px 16px",
                  border: `1px solid ${isSelected ? "var(--TURQUOISE)" : "var(--border-light)"}`,
                  borderRadius: "var(--border-radius-medium)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: isSelected ? "var(--bg-secondary)" : "var(--bg-primary)",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  ...commonFontStyle
                }}
              >
                <HistoryIcon 
                  style={{ 
                    width: 16, 
                    height: 16, 
                    flexShrink: 0, 
                    color: isSelected ? "var(--VIVA_MAGENTA)" : "var(--text-secondary)" 
                  }} 
                />
                <div style={{
                  fontSize: 14,
                  flex: 1,
                  overflow: "hidden",
                  color: "var(--text-primary)"
                }}>
                  <span style={{ 
                    fontSize: 12, 
                    color: "var(--text-secondary)" 
                  }}>
                    session {index + 1}.
                  </span>{" "}
                  {duration} ({timeRange})
                </div>
                
                {/* Selection indicator */}
              
              </div>
            );
          })}
        </div>

        {/* Button area - same style as HomeStopModal */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          gap: 12, 
          marginTop: "auto"
        }}>
          {/* Cancel button - left */}
          <button
            onClick={onClose}
            style={{
              width: 140, 
              height: 35,
              borderRadius: "var(--border-radius-small)",
              border: "none", 
              background: "transparent",
              fontSize: 16, 
              fontWeight: 600,
              cursor: "pointer",
              transition: "color 0.2s ease",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: 8, 
              ...commonFontStyle,
              color: "var(--text-primary)",
            }}
          >
            <span style={{ color: "currentColor" }}>cancel</span>
          </button>
          
          {/* Export button - right */}
          <button
            onClick={handleConfirmClick}
            style={{
              width: 140, 
              height: 35,
              background: "none", 
              border: "none",
              borderRadius: "var(--border-radius-small)",
              cursor: "pointer",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: 8,
              color: "var(--TURQUOISE)", 
              ...commonFontStyle,
            }}
          >
            <ExportIcon width={16} height={16} style={{ color: "currentColor" }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>내보내기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSelectModal;
