import React from "react";

interface ProfileSectionProps {
  avatar: string;
  nickname: string;
  cheerData: {
    type: 'text' | 'image' | 'textWithImage';
    message?: string | React.ReactNode; // ✅ 수정
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
      height: 70, // 80 → 70으로 줄임
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
          🔥 잠시 테스트 - imageUrl: {cheerData.imageUrl} - message: {String(cheerData.message)}
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
      {/* 새로운 레이아웃: 닉네임을 맨 위로 */}
      <div style={{
        width: "calc(100% - 32px)",
        margin: "12px auto 0 auto", // 18px → 12px로 줄임
        boxSizing: "border-box"
      }}>
        
        {/* 닉네임을 맨 위로 */}
<div style={{
  fontSize: 16,
  lineHeight: "20px",
  color: "var(--text-primary)",
  textAlign: "center",
  marginBottom: 8,
  width: "70px",        // ← 프로필 사진 너비와 동일
  marginLeft: "0px",    // ← 왼쪽 시작점 맞춤
  ...commonFontStyle
}}>
  {nickname}
</div>

        {/* 프로필 사진 + 응원글 */}
        <div style={{
          display: "flex",
          alignItems: "flex-start", // 상단 정렬
          gap: 18 // 22px → 18px로 줄임
        }}>
          {/* 프로필 사진 */}
          <div style={{
            flexShrink: 0
          }}>
            <div 
              style={{
                width: "70px", // 80px → 70px로 줄임
                height: "70px",
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
                    width: "70px",
                    height: "70px",
                    borderRadius: "var(--border-radius-large)",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              ) : (
                <div style={{
                  width: "70px",
                  height: "70px",
                  background: "var(--info-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--border-radius-large)"
                }}>
                  <span style={{ 
                    fontSize: 11, // 12px → 11px로 줄임
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

          {/* 응원글 */}
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