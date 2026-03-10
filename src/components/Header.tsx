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
  color = "var(--TURQUOISE)", // using CSS variable
  topMargin = 0
}: HeaderProps) {
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)", // using CSS variable
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

return (
  // The outermost div only handles background color and top margin
  <div style={{
    width: "100%",
    background: "var(--bg-primary)",
    marginTop: `${topMargin}px`
  }}>
    {/* The actual content and border are handled in the inner div with padding */}
    <div style={{
      width: "100%",
      height: 42,
      borderBottom: "var(--border-light)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px", // left and right padding goes here
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