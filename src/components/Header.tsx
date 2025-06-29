"use client";

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  color?: string;
  topMargin?: number;
}

function Header({ 
  title = "Today", 
  onBack, 
  showBackButton = false,
  color = "#45b5aa",
  topMargin = 0
}: HeaderProps) {
  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 375,
      margin: `${topMargin}px auto 0 auto`,
      height: 42,
      background: "#ffffff",
      borderBottom: "0.5px solid #9e9c98",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <span style={{
        fontSize: 17,
        color: color,
        lineHeight: "140%",
        textAlign: "center",
        ...commonFontStyle
      }}>
        {title}
      </span>
    </div>
  );
}

export default Header;
