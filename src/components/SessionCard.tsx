// src/components/SessionCard.tsx
import React from "react";
import HistoryIcon from "../assets/icons/History.svg?react";
import CalDownIcon from "../assets/icons/cal_down.svg?react";
import EditIcon from "../assets/icons/edit.svg?react";
import ExportIcon from "../assets/icons/export.svg?react";
import DeleteIcon from "../assets/icons/delete.svg?react";
import { SessionData } from "../utils/statsUtils";
import { PracticeRecord } from "../contexts/PracticeDataContext";
import { generateExportImage } from "../screens/ExportCardModal";

interface SessionCardProps {
  session: SessionData;
  index: number;
  isExpanded: boolean;
  onSessionClick: (sessionId: string) => void;
  onEditSession: (session: SessionData) => void;
  onEditMemo: (session: SessionData) => void;
  onDeleteSession: (session: SessionData) => void;
  practiceRecords: PracticeRecord[];
  commonFontStyle: React.CSSProperties;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  index,
  isExpanded,
  onSessionClick,
  onEditSession,
  onEditMemo,
  onDeleteSession,
  practiceRecords,
  commonFontStyle
}) => {

  const handleShareSession = async (session: SessionData) => {
    try {
      const nickname = localStorage.getItem("nickname") || "피출러";
      const avatar = localStorage.getItem("avatar") || "";
      const sessionRecord = practiceRecords.find(r => r.id === session.id);
      
      if (!sessionRecord) return;

      const sessionDate = new Date(sessionRecord.startTime);
      
      const rootStyle = getComputedStyle(document.documentElement);
      const themeColors = {
        bgPrimary: rootStyle.getPropertyValue('--bg-primary').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
        textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
        turquoise: rootStyle.getPropertyValue('--TURQUOISE').trim(),
        borderLight: rootStyle.getPropertyValue('--border-light').trim().split(' ')[2] || '#E0E0E0'
      };

      const dateOptions: Intl.DateTimeFormatOptions = { 
        year: '2-digit', 
        month: '2-digit', 
        day: '2-digit', 
        weekday: 'short' 
      };
      const dateStr = new Intl.DateTimeFormat('ko-KR', dateOptions)
        .format(sessionDate)
        .replace(/\./g, '')
        .replace(/ /g, '.')
        .toUpperCase();

      const imageDataUrl = await generateExportImage(
        nickname, 
        dateStr, 
        session.duration, 
        avatar, 
        themeColors
      );
      
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const filenameDate = sessionDate.toISOString().slice(0, 10).replace(/-/g, '');
      const filenameTime = sessionDate.toTimeString().slice(0, 5).replace(/:/g, '');
      const filename = `피출기록_${filenameDate}_${filenameTime}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '피출 기록 공유',
          text: `${nickname}님의 ${dateStr} 피아노 연습 기록입니다.`,
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = filename;
        link.href = imageDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("공유 실패:", err);
      alert("기록을 공유하는 데 실패했습니다.");
    }
  };

  return (
    <div key={session.id}>
      {/* 메인 세션 카드 - 확장 가능 */}
      <div 
        onClick={() => onSessionClick(session.id)}
        style={{
          width: "100%", 
          minHeight: 32,
          margin: index === 0 ? "0 auto" : "10px auto 0 auto",
          padding: isExpanded ? "6px 10px 12px 10px" : "6px 10px",
          border: "0.7px solid var(--MIMOSA)", 
          borderRadius: 5,
          display: "flex", 
          flexDirection: "column",
          background: "var(--bg-primary)",
          boxSizing: "border-box", 
          cursor: "pointer",
          color: "var(--MIMOSA)",
          transition: "all 0.2s ease"
        }}
      >
        {/* 기존 세션 정보 헤더 */}
        <div style={{
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          position: 'relative'
        }}>
          <HistoryIcon width="16" height="16" />
          <div style={{ 
            fontSize: 14, 
            color: "var(--text-primary)", 
            flex: 1, 
            overflow: "hidden", 
            ...commonFontStyle 
          }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              session {session.sessionNumber}. 
            </span>
            {session.duration} ({session.timeRange})
          </div>
          <CalDownIcon 
            width="9" 
            height="6" 
            style={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
              transition: 'transform 0.2s ease'
            }} 
          />
        </div>
        
        {/* 확장된 영역 - 아이콘 + 메모 */}
        {isExpanded && (
          <div style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
            {/* ✅ 액션 아이콘들 - 그레이 색상으로 변경 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingLeft: 4
            }}>
              {/* 수정 아이콘 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSession(session);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
                title="시간 수정"
              >
                <EditIcon 
                  style={{ color: "var(--DARK_GRAY)" }} 
                  width="16" 
                  height="16" 
                />
              </button>

              {/* 공유 아이콘 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareSession(session);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
                title="공유"
              >
                <ExportIcon 
                  style={{ color: "var(--DARK_GRAY)" }} 
                  width="16" 
                  height="16" 
                />
              </button>

              {/* 삭제 아이콘 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
                title="삭제"
              >
                <DeleteIcon 
                  style={{ color: "var(--DARK_GRAY)" }} 
                  width="16" 
                  height="16" 
                />
              </button>
            </div>
            
            {/* 메모 영역 - 클릭 가능 */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onEditMemo(session);
              }}
              style={{
                fontSize: 13, 
                color: "var(--text-secondary)", 
                lineHeight: "18px",
                textAlign: "left",
                paddingLeft: 4,
                cursor: "pointer",
                padding: "8px 12px",
                background: "var(--info-bg)",
                borderRadius: 6,
                border: "1px dashed var(--border-light)",
                transition: "all 0.2s ease",
                ...commonFontStyle
              }}
              title="클릭해서 메모 편집"
            >
              <span style={{ fontWeight: 500, marginBottom: 4, color: "var(--text-primary)" }}>메모:</span>
              <br />
              {session.memo || "메모를 추가하려면 클릭하세요"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};