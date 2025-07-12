import React, { useState } from "react";
import { generateExportImage } from "../screens/ExportCardModal";
import SessionSelectModal from "./SessionSelectModal";

interface StatsCardProps {
  icon: React.ElementType;
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
  title: string;
  value: string;
  iconColor?: string;
  onClick?: () => void;
  showExportIcon?: boolean;
  exportIcon?: React.ElementType;
}

interface PracticeRecord {
  id: string;
  date: string;
  practiceTime: number;
  startTime: number;
  endTime: number;
  memo?: string;
  track?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  iconAlt,
  iconWidth,
  iconHeight,
  title,
  value,
  iconColor,
  onClick,
  showExportIcon = false,
  exportIcon: ExportIcon
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionsToExport, setSessionsToExport] = useState<PracticeRecord[]>([]);

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

    // 현재 테마의 CSS 변수 값을 읽어옵니다.
    const rootStyle = getComputedStyle(document.documentElement);
    const themeColors = {
      bgPrimary: rootStyle.getPropertyValue('--bg-primary').trim(),
      textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
      textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
      turquoise: rootStyle.getPropertyValue('--TURQUOISE').trim(),
      borderLight: rootStyle.getPropertyValue('--border-light').trim().split(' ')[2] || '#E0E0E0'
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: '2-digit', month: '2-digit', day: '2-digit', weekday: 'short'
    };
    const dateStr = new Intl.DateTimeFormat('ko-KR', dateOptions)
                       .format(sessionDate)
                       .replace(/\./g, '')
                       .replace(/ /g, '.')
                       .toUpperCase();

    const hours = Math.floor(session.practiceTime / 60);
    const minutes = session.practiceTime % 60;
    
    let practiceTimeFormatted: string;
    if (hours > 0 && minutes > 0) {
      practiceTimeFormatted = `${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      practiceTimeFormatted = `${hours}시간`;
    } else {
      practiceTimeFormatted = `${minutes}분`;
    }

    // generateExportImage 호출 시 themeColors 인자를 추가합니다.
    const imageDataUrl = await generateExportImage(nickname, dateStr, practiceTimeFormatted, avatar, themeColors);
    
    const link = document.createElement("a");
    const filenameDate = new Date(session.startTime).toISOString().slice(0, 10).replace(/-/g, '');
    const filenameTime = new Date(session.startTime).toTimeString().slice(0, 5).replace(/:/g, '');
    link.download = `피출 기록_${filenameDate}_${filenameTime}.png`;
    link.href = imageDataUrl;
    link.click();
    
    alert("익스포트가 완료되었습니다!");
    setIsModalOpen(false);
  } catch (err) {
    console.error("익스포트 실패:", err);
    alert("익스포트에 실패했습니다.");
  }
};

  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const practiceRecords: PracticeRecord[] = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
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

    } catch (err) {
      console.error("익스포트 데이터 로딩 실패:", err);
      alert("익스포트에 필요한 데이터를 불러오지 못했습니다.");
    }
  };

  return (
    <>
      <div
        style={{
          width: "calc(100% - 32px)",
          height: 60,
          background: "var(--bg-primary)",
          border: "var(--border-light)",
          borderRadius: "var(--border-radius-large)",
          display: "flex",
          alignItems: "center",
          padding: "16px",
          gap: 12,
          margin: "7px auto 0 auto",
          boxSizing: "border-box",
          fontFamily: "var(--FONT_FAMILY)",
          cursor: onClick ? "pointer" : "default",
          transition: "var(--transition-fast)"
        }}
        onClick={onClick}
      >
        <div style={{ color: iconColor || "var(--text-secondary)" }}>
          <Icon alt={iconAlt} width={iconWidth} height={iconHeight} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: "20px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {title}
          </span>
          <span style={{
            fontSize: 12,
            color: "var(--text-primary)",
            lineHeight: "16px",
            textAlign: "left",
            ...commonFontStyle
          }}>
            {value}
          </span>
        </div>
        
        {/* ✅ [수정] ExportIcon 컴포넌트에 onClick을 직접 전달합니다. */}
        {showExportIcon && ExportIcon && (
          <ExportIcon
            alt="export"
            width="16"
            height="20"
            onClick={handleExportClick} 
            style={{
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "var(--transition-fast)",
              opacity: 0.8
            }}
            onMouseOver={(e: React.MouseEvent<SVGSVGElement>) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseOut={(e: React.MouseEvent<SVGSVGElement>) => {
              e.currentTarget.style.opacity = "0.8";
            }}
          />
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