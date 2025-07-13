import React, { useState } from "react";
import { generateExportImage } from "../screens/ExportCardModal";
import SessionSelectModal from "./SessionSelectModal";
// ✅ 1. 중앙 데이터 관리소(Context)를 사용하기 위해 import 합니다.
import { usePracticeData, PracticeRecord } from "../contexts/PracticeDataContext";

interface StatsCardProps {
  Icon: React.ElementType;
  iconAlt: string;
  // ✅ 2. props 타입 정의에 iconWidth와 iconHeight를 다시 추가합니다.
  iconWidth: number;
  iconHeight: number;
  title: string;
  value: string;
  iconColor?: string;
  onClick?: () => void;
  showExportIcon?: boolean;
  ExportIcon?: React.ElementType;
}

const StatsCard: React.FC<StatsCardProps> = ({
  Icon,
  iconAlt,
  iconWidth,   // ✅ 3. props에서 iconWidth와 iconHeight를 받도록 추가합니다.
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
  // ✅ 4. Context 훅을 통해 최신 practiceRecords를 가져옵니다.
  const { practiceRecords } = usePracticeData();

  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const exportSelectedSession = async (session: PracticeRecord) => {
    try {
      const nickname = localStorage.getItem("nickname") || "피출러";
      const avatar = localStorage.getItem("avatar") || "";
      const sessionDate = new Date(session.startTime);

      const rootStyle = getComputedStyle(document.documentElement);
      const themeColors = {
        bgPrimary: rootStyle.getPropertyValue('--bg-primary').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
        textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
        turquoise: rootStyle.getPropertyValue('--TURQUOISE').trim(),
        borderLight: rootStyle.getPropertyValue('--border-light').trim().split(' ')[2] || '#E0E0E0'
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
    // ✅ 5. localStorage에서 직접 읽는 대신, Context에서 가져온 최신 데이터를 사용합니다.
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaySessions = practiceRecords.filter(
      (r: PracticeRecord) => r.date === todayKey && r.practiceTime > 0
    );

    if (todaySessions.length === 0) {
      alert("오늘은 아직 연습 기록이 없습니다.");
      return;
    }
    setSessionsToExport(todaySessions);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        style={{
          width: "calc(100% - 32px)", height: 60, background: "var(--bg-primary)",
          border: "var(--border-light)", borderRadius: "var(--border-radius-large)",
          display: "flex", alignItems: "center", padding: "16px", gap: 12,
          margin: "7px auto 0 auto", boxSizing: "border-box", cursor: onClick ? "pointer" : "default",
          transition: "var(--transition-fast)"
        }}
        onClick={onClick}
      >
        <div style={{ color: iconColor || "var(--text-secondary)", display: 'flex' }}>
          <Icon style={{ width: iconWidth, height: iconHeight }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: "20px", textAlign: "left", ...commonFontStyle }}>
            {title}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: "16px", textAlign: "left", ...commonFontStyle }}>
            {value}
          </span>
        </div>
        
        {showExportIcon && ExportIcon && (
          <div
            onClick={handleExportClick} 
            style={{ color: "var(--text-secondary)", cursor: "pointer", transition: "var(--transition-fast)", opacity: 0.8 }}
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
    </>
  );
};

export default StatsCard;