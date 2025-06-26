"use client";

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

function Header({ 
  title = "Today", 
  onBack, 
  showBackButton = false 
}: HeaderProps) {
  const commonFontStyle = {
    fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div style={{
      position: "absolute",
      left: 1,
      top: 44,
      width: 375,
      height: 42,
      background: "#ffffff",
      borderBottom: "0.5px solid #9e9c98",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <span style={{
        fontSize: 17,
        color: "#45b5aa",
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
