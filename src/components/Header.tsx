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
  color = "var(--TURQUOISE)",
  topMargin = 0
}: HeaderProps) {
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  return (
    // ✅ 1. 가장 바깥 div는 패딩과 위쪽 마진만 담당합니다.
    <div style={{
      width: "100%",
      maxWidth: "100%",
      padding: "0 16px", // 좌우 패딩을 여기서 줍니다.
      marginTop: `${topMargin}px`,
      background: "var(--bg-primary)", // 배경색은 그대로 유지
      boxSizing: "border-box"
    }}>
      {/* ✅ 2. 실제 콘텐츠와 밑줄은 안쪽 div에서 처리합니다. */}
      <div style={{
        width: "100%",
        height: 42,
        borderBottom: "var(--border-light)", // 패딩이 적용된 공간 안에서 밑줄이 그어짐
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
    </div>
  );
}

export default Header;