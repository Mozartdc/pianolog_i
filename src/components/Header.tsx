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
  // ✅ 1. 가장 바깥 div는 배경색과 위쪽 마진만 담당합니다.
  <div style={{
    width: "100%",
    background: "var(--bg-primary)",
    marginTop: `${topMargin}px`
  }}>
    {/* ✅ 2. 실제 콘텐츠와 밑줄은 패딩이 적용된 안쪽 div에서 처리합니다. */}
    <div style={{
      width: "100%",
      height: 42,
      borderBottom: "var(--border-light)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px", // ✅ 여기에 좌우 패딩을 줍니다.
      boxSizing: "border-box"
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
  </div>
);
}

export default Header;