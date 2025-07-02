import React from "react";
import { generateExportImage } from "../screens/ExportCardModal";

interface StatsCardProps {
  icon: string;
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
  title: string;
  value: string;
  onClick?: () => void;
  showExportIcon?: boolean;
  exportIcon?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  iconAlt,
  iconWidth,
  iconHeight,
  title,
  value,
  onClick,
  showExportIcon = false,
  exportIcon
}) => {
  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  // 익스포트 아이콘 클릭 핸들러 (다운로드 방식)
  const handleExportClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nickname = localStorage.getItem("nickname") || "피출러";
      const avatar = localStorage.getItem("avatar") || "";
      const today = new Date();
      const dateStr = today.toLocaleDateString("ko-KR", { 
        year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" 
      }).replace(/\./g, '').replace(/ /g, '.').toUpperCase();
      const practiceRecords = JSON.parse(localStorage.getItem("practiceRecords") || "[]");
      const todayKey = today.toISOString().slice(0, 10);
      const totalMinutes = practiceRecords
        .filter((r: any) => r.date === todayKey)
        .reduce((sum: number, r: any) => sum + (r.practiceTime || 0), 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const practiceTime = `${hours}시간 ${minutes}분`;

      const imageDataUrl = await generateExportImage(nickname, dateStr, practiceTime, avatar);

      // 다운로드 링크 생성 및 클릭
      const link = document.createElement("a");
      link.download = "practice-record.png";
      link.href = imageDataUrl;
      link.click();
    } catch (err) {
      console.error("다운로드 실패:", err);
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    <div 
      style={{
        width: "100%",
        maxWidth: 345,
        height: 60,
        background: "#ffffff",
        border: "0.5px solid #9e9c98",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
        margin: "7px auto 0 auto"
      }}
    >
      <img src={icon} alt={iconAlt} width={iconWidth} height={iconHeight} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ 
          fontSize: 14, 
          color: "#9e9c98", 
          lineHeight: "20px",
          textAlign: "left",
          ...commonFontStyle
        }}>
          {title}
        </span>
        <span style={{ 
          fontSize: 12, 
          color: "#2d2d2a", 
          lineHeight: "16px",
          textAlign: "left",
          ...commonFontStyle
        }}>
          {value}
        </span>
      </div>
      {showExportIcon && exportIcon && (
        <img 
          src={exportIcon} 
          alt="export" 
          width="16" 
          height="20"
          onClick={handleExportClick}
          style={{ cursor: "pointer" }}
        />
      )}
    </div>
  );
};

export default StatsCard;
