// src/components/Header.tsx
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
  color = "var(--TURQUOISE)", // CSS 변수 사용
  topMargin = 0
}: HeaderProps) {
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)", // CSS 변수 사용
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: "100%", // ⭐ 이 부분을 "100%"로 변경했습니다.
      margin: `${topMargin}px auto 0 auto`,
      height: 42,
      background: "var(--bg-primary)",        // CSS 변수 사용
      borderBottom: "var(--border-light)",    // CSS 변수 사용
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--FONT_FAMILY)"        // 폰트 통일
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