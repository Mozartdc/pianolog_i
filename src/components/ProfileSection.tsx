import React from "react";

interface ProfileSectionProps {
  avatar: string;
  nickname: string;
  cheerData: {
    type: 'text' | 'image' | 'textWithImage';
    message?: string | React.ReactNode;
    imageUrl?: string;
    imageAlt?: string;
  };
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ avatar, nickname, cheerData }) => {
  const commonFontStyle = {
    fontFamily: "var(--FONT_FAMILY)",
    WebkitFontSmoothing: "antialiased" as const,
    MozOsxFontSmoothing: "grayscale" as const
  };

  const renderCheerContent = () => {
    const baseStyle = {
      width: "100%",
      height: 70,
      fontSize: 11,
      color: "var(--text-secondary)",
      fontFamily: "var(--FONT_FAMILY)",
      lineHeight: "20px",
      textAlign: "left" as const,
      display: "flex",
      alignItems: "center"
    };

    switch (cheerData.type) {
      case 'image':
        return (
          <div style={baseStyle}>
            <img 
              src={cheerData.imageUrl} 
              alt={cheerData.imageAlt || "특별 이미지"}
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "contain",
                borderRadius: "var(--border-radius-medium)"
              }}
            />
          </div>
        );
      
      case 'textWithImage':
        return (
          <div style={baseStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%" }}>
              <img 
                src={cheerData.imageUrl} 
                alt={cheerData.imageAlt || "이미지"}
                style={{ 
                  width: 35,
                  height: 35, 
                  objectFit: "contain",
                  borderRadius: "var(--border-radius-small)",
                  flexShrink: 0
                }}
              />
              <div style={{ 
                flex: 1, 
                fontSize: 11, 
                lineHeight: "16px",
                color: "var(--text-secondary)",
                fontFamily: "var(--FONT_FAMILY)"
              }}>
                {cheerData.message}
              </div>
            </div>
          </div>
        );
      
      case 'text':
      default:
        return (
          <div style={{...baseStyle, alignItems: "flex-start"}}>
            {cheerData.message}
          </div>
        );
    }
  };

  return (
    <>
      {/* New layout: Move nickname to the top */}
      <div style={{
        width: "calc(100% - 32px)",
        margin: "12px auto 0 auto",
        boxSizing: "border-box"
      }}>
        
        {/* Move nickname to top - Updated to match 80px */}
        <div style={{
          fontSize: 16,
          lineHeight: "20px",
          color: "var(--text-primary)",
          textAlign: "center",
          marginBottom: 8,
          width: "80px",        // 70px → 80px
          marginLeft: "0px",
          ...commonFontStyle
        }}>
          {nickname}
        </div>

        {/* Profile picture + cheer message */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 18
        }}>
          {/* Profile picture - Unified to 80px */}
          <div style={{
            flexShrink: 0
          }}>
            <div 
              style={{
                width: "80px",     // Keep
                height: "80px",    // Keep
                borderRadius: "var(--border-radius-large)",
                overflow: "hidden",
                background: avatar ? "transparent" : "var(--info-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="프로필" 
                  style={{ 
                    width: "80px",    // 70px → 80px
                    height: "80px",   // 70px → 80px
                    borderRadius: "var(--border-radius-large)",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              ) : (
                <div style={{
                  width: "80px",    // 70px → 80px
                  height: "80px",   // 70px → 80px
                  background: "var(--info-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--border-radius-large)"
                }}>
                  <span style={{ 
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    ...commonFontStyle
                  }}>
                    프로필
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cheer message */}
          <div style={{
            flex: 1,
            minWidth: 0
          }}>
            {renderCheerContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSection;