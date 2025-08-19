import React, { useState } from "react";
import { generateExportImage } from "../screens/ExportCardModal";
import SessionSelectModal from "./SessionSelectModal";
import { usePracticeData, PracticeRecord } from "../contexts/PracticeDataContext";
import dayjs from "dayjs";
import OkIcon from "../assets/icons/ok.svg?react";

interface StatsCardProps {
  Icon: React.ElementType;
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
  title: string;
  value: string;
  iconColor?: string;
  onClick?: () => void;
  showExportIcon?: boolean;
  ExportIcon?: React.ElementType;
}

// ✅ [수정] 기록 없음 모달 컴포넌트 - 다른 모달과 통일된 스타일
const NoRecordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
          minHeight: 100,
          maxHeight: "80vh",
          boxShadow: "var(--shadow-medium)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 20px 20px 20px",
          boxSizing: "border-box",
          position: "relative",
          overflowY: "auto",
          border: "var(--modal-border)",
          textAlign: "center",
          ...commonFontStyle
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 메시지 */}
        <div style={{ 
          marginBottom: 24, 
          fontSize: 16, 
          color: "var(--text-primary)",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...commonFontStyle
        }}>
          오늘은 아직 연습 기록이 없습니다.
        </div>

        {/* ✅ 다른 모달과 동일한 버튼 스타일 */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          marginTop: "auto"
        }}>
          <button
            onClick={onClose}
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
              color: "var(--VIVA_MAGENTA)",
              ...commonFontStyle,
            }}
          >
            <OkIcon width={16} height={16} style={{ color: "currentColor" }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatsCard: React.FC<StatsCardProps> = ({
  Icon,
  iconAlt,
  iconWidth,
  iconHeight,
  title,
  value,
  iconColor,
  onClick,
  showExportIcon = false,
  ExportIcon
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionsToExport, setSessionsToExport] = useState<PracticeRecord[]>([]);
  const [showNoRecordModal, setShowNoRecordModal] = useState(false);
  const { practiceRecords } = usePracticeData();

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const exportSelectedSession = async (session: PracticeRecord) => {
    try {
      // ✅ 닉네임 기본값 수정
      const nickname = localStorage.getItem("nickname") || "디붕이";
      const avatar = localStorage.getItem("avatar") || "";
      const sessionDate = new Date(session.startTime);

      const rootStyle = getComputedStyle(document.documentElement);
      // ✅ 색상 처리 개선
      const themeColors = {
        bgPrimary: rootStyle.getPropertyValue('--bg-primary').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
        textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
        turquoise: rootStyle.getPropertyValue('--TURQUOISE').trim(),
        borderLight: rootStyle.getPropertyValue('--text-secondary').trim() // ✅ 간단한 처리
      };

      const dateOptions: Intl.DateTimeFormatOptions = { year: '2-digit', month: '2-digit', day: '2-digit', weekday: 'short' };
      const dateStr = new Intl.DateTimeFormat('ko-KR', dateOptions).format(sessionDate).replace(/\./g, '').replace(/ /g, '.').toUpperCase();

      const hours = Math.floor(session.practiceTime / 60);
      const minutes = session.practiceTime % 60;
      
      let practiceTimeFormatted: string;
      if (hours > 0 && minutes > 0) { practiceTimeFormatted = `${hours}시간 ${minutes}분`; } 
      else if (hours > 0) { practiceTimeFormatted = `${hours}시간`; } 
      else { practiceTimeFormatted = `${minutes}분`; }

      const imageDataUrl = await generateExportImage(nickname, dateStr, practiceTimeFormatted, avatar, themeColors);
      
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const filenameDate = new Date(session.startTime).toISOString().slice(0, 10).replace(/-/g, '');
      const filenameTime = new Date(session.startTime).toTimeString().slice(0, 5).replace(/:/g, '');
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
      setIsModalOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('사용자가 공유를 취소했습니다.');
      } else {
        console.error("공유/익스포트 실패:", err);
        alert("기록을 공유하거나 내보내는 데 실패했습니다.");
      }
      setIsModalOpen(false);
    }
  };

  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const todayKey = dayjs().format("YYYY-MM-DD");
    const todaySessions = practiceRecords.filter(
      (r: PracticeRecord) => r.date === todayKey && r.practiceTime > 0
    );

    if (todaySessions.length === 0) {
      setShowNoRecordModal(true);
      return;
    }
    setSessionsToExport(todaySessions);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        style={{
          width: "calc(100% - 32px)", 
          height: 58, 
          background: "var(--bg-primary)",
          border: "var(--border-light)", 
          borderRadius: "var(--border-radius-large)",
          display: "flex", 
          alignItems: "center", 
          padding: "14px", 
          gap: 12,
          margin: "5px auto 0 auto", 
          boxSizing: "border-box", 
          cursor: onClick ? "pointer" : "default",
          transition: "var(--transition-fast)"
        }}
        onClick={onClick}
      >
        {/* 아이콘 */}
        <div style={{ color: iconColor || "var(--text-secondary)", display: 'flex' }}>
          <Icon style={{ width: iconWidth, height: iconHeight }} />
        </div>

        {/* 한 줄 레이아웃 */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          flex: 1, 
          minWidth: 0,
          gap: 10
        }}>
          {/* value (1시간 0분) */}
          <span style={{ 
            fontSize: 14,
            color: "var(--text-primary)", 
            lineHeight: "16px", 
            whiteSpace: "nowrap",
            ...commonFontStyle 
          }}>
            {value}
          </span>
          
          {/* title (오늘의 피출 기록) */}
          <span style={{ 
            fontSize: 12,
            color: "var(--text-secondary)", 
            lineHeight: "20px", 
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            ...commonFontStyle 
          }}>
            {title}
          </span>
        </div>
        
        {/* 내보내기 아이콘 */}
        {showExportIcon && ExportIcon && (
          <div
            onClick={handleExportClick} 
            style={{ 
              color: "var(--text-secondary)", 
              cursor: "pointer", 
              transition: "var(--transition-fast)", 
              opacity: 0.8,
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = "0.8"; }}
          >
            <ExportIcon style={{ width: 16, height: 20 }} />
          </div>
        )}
      </div>

      <SessionSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessions={sessionsToExport}
        onSelectSession={exportSelectedSession}
      />

      <NoRecordModal
        isOpen={showNoRecordModal}
        onClose={() => setShowNoRecordModal(false)}
      />
    </>
  );
};

export default StatsCard;