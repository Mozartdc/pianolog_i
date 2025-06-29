import React from "react";

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

  return (
    <div 
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
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
        <img src={exportIcon} alt="export" width="16" height="20" />
      )}
    </div>
  );
};

export default StatsCard;
