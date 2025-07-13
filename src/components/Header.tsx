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
  color = "var(--TURQUOISE)",
  topMargin = 0
}: HeaderProps) {
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    // ✅ 하나의 div로 구조를 단순화하고, 여기에 모든 스타일을 적용합니다.
    <div style={{
      width: "100%",
      height: 42,
      background: "var(--bg-primary)",
      borderBottom: "var(--border-light)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: `0 16px`, // ✅ 헤더 자체에 좌우 패딩을 줍니다.
      marginTop: `${topMargin}px`,
      boxSizing: "border-box" // 패딩이 크기에 영향을 주도록 설정
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