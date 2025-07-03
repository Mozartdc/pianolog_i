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
    fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
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
        // ✅ 완전 반응형: 고정 maxWidth 제거
        width: "calc(100% - 32px)", // 좌우 16px 패딩 고려
        height: 60,
        background: "var(--bg-primary)", // ✅ CSS 변수 적용
        border: "var(--border-light)", // ✅ CSS 변수 적용
        borderRadius: "var(--border-radius-large)", // ✅ CSS 변수 적용
        display: "flex",
        alignItems: "center",
        padding: "16px", // ✅ 패딩 통일
        gap: 12,
        margin: "7px auto 0 auto", // 중앙 정렬
        boxSizing: "border-box", // ✅ 박스 사이징 명시
        fontFamily: "var(--FONT_FAMILY)", // ✅ CSS 변수 적용
        cursor: onClick ? "pointer" : "default", // ✅ 클릭 가능 시 커서 변경
        transition: "var(--transition-fast)" // ✅ 부드러운 호버 효과
      }}
      onClick={onClick}
    >
      <img src={icon} alt={iconAlt} width={iconWidth} height={iconHeight} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <span style={{ 
          fontSize: 14, 
          color: "var(--text-secondary)", // ✅ CSS 변수 적용
          lineHeight: "20px",
          textAlign: "left",
          ...commonFontStyle
        }}>
          {title}
        </span>
        <span style={{ 
          fontSize: 12, 
          color: "var(--text-primary)", // ✅ CSS 변수 적용
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
          style={{ 
            cursor: "pointer",
            transition: "var(--transition-fast)", // ✅ 부드러운 호버 효과
            opacity: 0.8
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
        />
      )}
    </div>
  );
};

export default StatsCard;
